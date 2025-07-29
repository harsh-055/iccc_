import { ForbiddenException, Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AuthHelper } from './utils/auth.helper';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';

// Database types based on 001-init.sql schema
interface User {
    id: string; // UUID
    name: string; // VARCHAR(255) NOT NULL
    email: string; // VARCHAR(255) UNIQUE NOT NULL
    phone_number: string | null; // VARCHAR(20) - nullable
    password: string; // VARCHAR(255) NOT NULL
    is_mfa_enabled: boolean; // BOOLEAN DEFAULT false
    is_locked: boolean; // BOOLEAN DEFAULT false
    created_at: Date; // TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    updated_at: Date; // TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
}

interface UserLoginDetails {
    
    id: string; // UUID
    user_id: string; // UUID UNIQUE NOT NULL
    last_login: Date; // TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    whitelisted_ip: string[]; // TEXT[]
    failed_attempts: number; // INTEGER DEFAULT 0
    last_failed_ip: string | null; // VARCHAR(45) - nullable
    last_failed_at: Date | null; // TIMESTAMP WITH TIME ZONE - nullable
}

interface MFA {
    id: string; // UUID
    user_id: string; // UUID UNIQUE NOT NULL
    secret: string; // VARCHAR(255) NOT NULL
    qr_base64: string; // TEXT NOT NULL
    created_at: Date; // TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    updated_at: Date; // TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
}

@Injectable()
export class LocalauthService {
    constructor(
        private databaseService: DatabaseService, 
        private authHelper: AuthHelper
    ) {}

    /**
     * Hash password, track signup IP, and whitelist first IP
     */
    async createUser(data: SignupDto, req: any) {
        const { name, email, password, username, phoneNumber } = data;
        const hashedPassword = await bcrypt.hash(password, 10);
        const userIp = req.ip;

        // Create user
        const userResult = await this.databaseService.query<User>(
            `INSERT INTO users (email, name, phone_number, password, is_mfa_enabled, is_locked)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [email, name, phoneNumber || null, hashedPassword, false, false]
        );
        const user = userResult.rows[0];

        // Create user login details
        await this.databaseService.query(
            `INSERT INTO user_login_details (user_id, whitelisted_ip, failed_attempts)
             VALUES ($1, $2::text[], $3)`,
            [user.id, [userIp], 0]
        );

        const loginData = {
            email: data.email,
            password: data.password,
        };
        return await this.login(req, loginData);
    }

    async disableUserMFA(req) {
        const userId = req.user.id;
        await this.databaseService.query(
            'UPDATE users SET is_mfa_enabled = $1 WHERE id = $2',
            [false, userId]
        );
        return { message: 'MFA disabled successfully' };
    }

    async activateUserMFA(req) {
        const userId = req.user.id;
        
        // Check if MFA exists
        const mfaResult = await this.databaseService.query<MFA>(
            'SELECT * FROM mfa WHERE user_id = $1',
            [userId]
        );
        
        if (mfaResult.rows.length > 0) {
            console.log('mfa already exists');
            const mfa = mfaResult.rows[0];
            const imageBuffer = Buffer.from(mfa.qr_base64.split(',')[1], 'base64');
            return imageBuffer;
        }

        let { secret, qrCode } = await this.authHelper.generateMfaSecret(req.user.email);
        
        // Create MFA record
        await this.databaseService.query(
            `INSERT INTO mfa (user_id, secret, qr_base64)
             VALUES ($1, $2, $3)`,
            [userId, secret, qrCode]
        );

        // Update user to enable MFA
        await this.databaseService.query(
            'UPDATE users SET is_mfa_enabled = $1 WHERE id = $2',
            [true, userId]
        );

        const imgBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
        return imgBuffer;
    }

    async login(req, data) {
        const { email, password } = data;
        
        // Find user by email
        const userResult = await this.databaseService.query<User>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            return new UnauthorizedException('Invalid credentials!');
        }
        
        const user = userResult.rows[0];
        
        if (user.is_locked) {
            throw new ForbiddenException('Account is locked! Perform MFA to unlock');
        }

        if (await bcrypt.compare(password, user.password)) {
            if (user.is_mfa_enabled) {
                if (!data.mfaToken) throw new ForbiddenException('MFA token is required');
                
                // Get MFA details
                const mfaResult = await this.databaseService.query<MFA>(
                    'SELECT * FROM mfa WHERE user_id = $1',
                    [user.id]
                );
                
                if (mfaResult.rows.length === 0) {
                    throw new ForbiddenException('MFA is not enabled for this user');
                }
                
                const mfa = mfaResult.rows[0];
                const isValid = await this.authHelper.verifyMfaToken(mfa.secret, data.mfaToken);
                if (!isValid) throw new ForbiddenException('Invalid MFA token');
            }
            
            if (data.isMfaEnabled) {
                this.activateUserMFA(req);
            }

            const logindata = {
                id: user.id,
            };

            // Get user login details
            const loginDetailsResult = await this.databaseService.query<UserLoginDetails>(
                'SELECT * FROM user_login_details WHERE user_id = $1',
                [user.id]
            );
            const userLoginDetails = loginDetailsResult.rows[0];

            // ✅ Enforce MFA if IP is not whitelisted
            if (!userLoginDetails.whitelisted_ip.includes(req.ip)) {
                throw new ForbiddenException('New IP detected. Verify via MFA');
            }

            let { accessToken, refreshToken } = await this.authHelper.generateTokens(logindata, req);
            
            return {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            };
        }
        
        return new UnauthorizedException('Invalid credentials!');
    }

    async MFA(req, userId, type) {
        return await this.authHelper.sendMFA(req, userId, type);
    }

    async validateUserAfterMFA(req, userId) {
        // Update whitelisted IPs
        await this.databaseService.query(
            `UPDATE user_login_details 
             SET whitelisted_ip = array_append(whitelisted_ip, $1)
             WHERE user_id = $2 AND NOT ($1 = ANY(whitelisted_ip))`,
            [req.ip, userId]
        );

        // Unlock user account
        await this.databaseService.query(
            'UPDATE users SET is_locked = $1 WHERE id = $2',
            [false, userId]
        );

        return { message: 'MFA verified successfully' };
    }

    async refreshToken(req: Request, data) {
        let { accessToken } = await this.authHelper.refreshAccessToken(data.refreshToken, req);
        return { accessToken };
    }

    async getSessions(req: any) {
        const sessions = await this.authHelper.getAllActiveSessions(req.user.id);
        
        return sessions.map(session => ({
            ip: session.ip,
            device: session.device,
            loggedInAt: session.logged
        }));
    }

    async logout(req: Request) {
        let { message } = await this.authHelper.logout(req);
        return { message };
    }
}