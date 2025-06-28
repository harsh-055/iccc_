import { ForbiddenException, Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthHelper } from './utils/auth.helper';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { User, Prisma } from '../../generated/client';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class LocalauthService {
    constructor(private prisma: PrismaService, private authHelper: AuthHelper) {}

    /**
     * Hash password, track signup IP, and whitelist first IP
     */
    async createUser(data: SignupDto, req: any) {
        const { name, email, password, username, phoneNumber } = data;
        const hashedPassword = await bcrypt.hash(password, 10);
        const userIp = req.ip;
        let userData = {
            email,
            name,
            phoneNumber: phoneNumber || null,
            password: hashedPassword,
            isMfaEnabled: false,
            isLocked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        const user = await this.prisma.user.create({
            data: userData
        });

        await this.prisma.userLoginDetails.create({
            data: {
                userId: user.id,
                lastLogin: new Date(),
                whitelistedIp: [userIp], // ✅ First IP is whitelisted
                failedAttempts: 0, // ✅ Track failed login attempts
                lastFailedIp: null,
                lastFailedAt: null,
            },
        });

        const loginData = {
            email: data.email,
            password: data.password,
        }
        return await this.login(req,loginData);
    }

    async disableUserMFA(req) {
        const userId = req.user.id;
        await this.prisma.user.update({
            where: { id: userId },
            data: { isMfaEnabled: false },}
        )
        return { message: 'MFA disabled successfully' };
    }

    async activateUserMFA(req) { 
        const userId = req.user.id;
        const mfaExists = await this.prisma.mfa.findUnique({
            where: { userId },
        });
        if (mfaExists) {
            console.log('mfa already exists')
            const imageBuffer = Buffer.from(mfaExists.qrBase64.split(',')[1], 'base64');
            return imageBuffer;
        }
        let {secret,qrCode } = await this.authHelper.generateMfaSecret(req.user.email);

        await this.prisma.mfa.create({
            data: {
                userId,
                secret,
                qrBase64: qrCode,
                createdAt: new Date(),
                updatedAt: new Date()
            },
        });
        
        await this.prisma.user.update({
            where: { id: userId },
            data: { isMfaEnabled: true },
        });
        const imgBuffer = Buffer.from(qrCode.split(',')[1], 'base64'); 
        return imgBuffer;
    }

    async login(req,data){
        const { email, password } = data;
        const user = await this.prisma.user.findUnique({
            where: { email }
        });

        if(user && user.isLocked){
            throw new ForbiddenException('Account is locked! Perform MFA to unlock');
        }

        if (user && await bcrypt.compare(password, user.password)) {

            if(user.isMfaEnabled) {
                if(!data.mfaToken) throw new ForbiddenException('MFA token is required');
                const mfa = await this.prisma.mfa.findUnique({
                    where: { userId: user.id },
                });
                if(!mfa) throw new ForbiddenException('MFA is not enabled for this user');
                const isValid = await this.authHelper.verifyMfaToken(mfa.secret, data.mfaToken);
                if(!isValid) throw new ForbiddenException('Invalid MFA token');
            }
            if(data.isMfaEnabled){
                this.activateUserMFA(req)
            }

            const logindata = {
                id:user.id,
            }
            const userLoginDetails = await this.prisma.userLoginDetails.findUnique({ where: { userId: user.id } });
            // ✅ Enforce MFA if IP is not whitelisted
            if (!userLoginDetails.whitelistedIp.includes(req.ip)) {
                throw new ForbiddenException('New IP detected. Verify via MFA');
            }

            let {accessToken,refreshToken} = await this.authHelper.generateTokens(logindata,req);
            return {accessToken,refreshToken,user:{
                id:user.id,
                name:user.name,
                email:user.email
            }};
            // return user;
        }

        return new UnauthorizedException('Invalid credentials!')
    }

    async MFA(req,userId,type){
        return await this.authHelper.sendMFA(req,userId,type);
    }

    async validateUserAfterMFA(req,userId){
        await this.prisma.userLoginDetails.update({
            where: { userId },
            data: {
                whitelistedIp: {
                    push: req.ip,
                },
            }
        })
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isLocked: false,
            }
        })
        return {message:'MFA verified successfully'};
    }

    async refreshToken(req:Request,data){
        let {accessToken} = await this.authHelper.refreshAccessToken(data.refreshToken,req);
        return {accessToken};
    }

    async getSessions(req: any) {
        const sessions = await this.authHelper.getAllActiveSessions(req.user.id);
        
        return sessions.map(session => ({
            ip:session.ip,
            device:session.device,
            loggedInAt:session.logged
        }))
    }   
    async logout(req:Request){
        let {message} = await this.authHelper.logout(req);
        return {message};
    }
}
