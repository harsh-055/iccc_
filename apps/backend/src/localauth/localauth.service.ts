
import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AuthHelper } from './utils/auth.helper';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordInitDto, VerifyOtpDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { LoginDto, MfaSetupRequestDto } from './dto/login.dto';
import { SystemRoleName } from '../common/constants/system-roles';

interface User {
    id: string; 
    first_name: string; 
    last_name: string; 
    email: string; 
    phone_number: string | null; 
    password: string; 
    is_mfa_enabled: boolean; 
   
    is_active: boolean;
    created_at: Date; 
    updated_at: Date; 
}

interface UserLoginDetails {
    id: string; 
    user_id: string;
    last_login: Date; 
    whitelisted_ip: string[]; 
    failed_attempts: number; 
    last_failed_ip: string | null; 
    last_failed_at: Date | null;
}

interface MFA {
    id: string; 
    user_id: string;
    secret: string; 
    qr_base64: string;
    is_setup_complete?: boolean;
    created_at: Date; 
    updated_at: Date; 
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
        const { 
            firstName, 
            lastName,
            email, 
            password, 
            confirmPassword,
            username, 
            phoneNumber,
            isOrganizationCreator,
            organizationName,
            organizationDescription,
            tenantId,
            parentId,
            parentName
        } = data;
        
        // Validate password confirmation
        if (password !== confirmPassword) {
            throw new ForbiddenException('Passwords do not match');
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const userIp = req.ip;

        // Use transaction for atomicity
        const client = await this.databaseService.getClient();
        
        try {
            await client.query('BEGIN');
            
            // Check if email already exists
            const existingUserResult = await client.query(
                'SELECT id, email, is_active FROM users WHERE LOWER(email) = LOWER($1)',
                [email]
            );
            
            // Check if any active user exists with this email
            const activeUsers = existingUserResult.rows.filter(user => user.is_active === true);
            
            if (activeUsers.length > 0) {
                throw new ForbiddenException('A user with this email already exists');
            }
            
            // Validate parent user if provided
            let validatedParentId = null;
            if (parentId) {
                const parentUserResult = await client.query(
                    'SELECT id, is_active FROM users WHERE id = $1 AND is_active = true',
                    [parentId]
                );
                
                if (parentUserResult.rows.length === 0) {
                    throw new BadRequestException('Parent user not found or inactive');
                }
                validatedParentId = parentId;
            } else if (parentName) {
                const parentUserResult = await client.query(
                    'SELECT id, is_active FROM users WHERE LOWER(first_name || \' \' || last_name) = LOWER($1) AND is_active = true',
                    [parentName]
                );
                
                if (parentUserResult.rows.length === 0) {
                    throw new BadRequestException('Parent user not found or inactive');
                }
                validatedParentId = parentUserResult.rows[0].id;
            }

            // Create user
            const userResult = await client.query<User>(
                `INSERT INTO users (email, first_name, last_name, phone_number, password, is_mfa_enabled, is_active, tenant_id, system_role_id, parent_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                 RETURNING *`,
                                  [email, firstName, lastName, phoneNumber || null, hashedPassword, false, true, null, null, validatedParentId]
            );
            const user = userResult.rows[0];

            // Create user login details
            await client.query(
                `INSERT INTO user_login_details (user_id, whitelisted_ip, failed_attempts, last_login)
                 VALUES ($1, $2::text[], $3, NOW())`,
                [user.id, [userIp], 0]
            );

            // Handle organization creation or joining
            let userTenantId = null;
            
            if (isOrganizationCreator && organizationName && !tenantId) {
                // Create new organization/tenant
                const tenantResult = await client.query(
                    `INSERT INTO tenants (name, description, created_by)
                     VALUES ($1, $2, $3)
                     RETURNING *`,
                    [organizationName, organizationDescription || null, user.id]
                );
                userTenantId = tenantResult.rows[0].id;
                
                // Create or find admin role
                let adminRoleResult;
                try {
                    // Look for existing tenant-specific admin role first
                    const existingRoleQuery = `
                        SELECT id FROM roles
                        WHERE LOWER(name) = LOWER($1) AND tenant_id = $2
                        LIMIT 1
                    `;
                    const existingRole = await client.query(existingRoleQuery, ['tenant-admin', userTenantId]);
                    
                    if (existingRole.rows.length > 0) {
                        // Use existing tenant-specific admin role
                        adminRoleResult = existingRole;
                    } else {
                        // Create new TENANT-SPECIFIC admin role (SaaS isolation)
                        adminRoleResult = await client.query(
                            `INSERT INTO roles (name, description, tenant_id, is_system, created_by)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING id`,
                            [
                                'tenant-admin',
                                'Administrative role for this tenant/organization only',
                                userTenantId, // ✅ TENANT-SPECIFIC role for SaaS isolation
                                false, // ✅ NOT a system role - tenant-scoped only
                                user.id
                            ]
                        );
                        
                        // ✅ FIX: Assign admin permissions to the new tenant-admin role
                        const adminPermissions = [
                            'users:manage', 'users:create', 'users:read', 'users:update', 'users:delete', 'users:list',
                            'roles:manage', 'roles:create', 'roles:read', 'roles:update', 'roles:assign', 'roles:list',
                            'permissions:read', 'permissions:list'
                        ];
                        
                        for (const permissionName of adminPermissions) {
                            const permissionResult = await client.query(
                                `SELECT id FROM permissions WHERE name = $1`,
                                [permissionName]
                            );
                            
                            if (permissionResult.rows.length > 0) {
                                await client.query(
                                    `INSERT INTO role_permissions (role_id, permission_id)
                                     VALUES ($1, $2)
                                     ON CONFLICT (role_id, permission_id) DO NOTHING`,
                                    [adminRoleResult.rows[0].id, permissionResult.rows[0].id]
                                );
                            }
                        }
                    }
                } catch (roleError) {
                    // If role creation fails, try to find tenant-specific admin role
                    const fallbackRoleQuery = `
                        SELECT id FROM roles 
                        WHERE LOWER(name) = LOWER($1) AND tenant_id = $2
                        LIMIT 1
                    `;
                    adminRoleResult = await client.query(fallbackRoleQuery, ['tenant-admin', userTenantId]);
                    
                    if (adminRoleResult.rows.length === 0) {
                        throw new BadRequestException('Unable to create or find admin role');
                    }
                }
                
                // Update user with tenant_id and system_role_id
                await client.query(
                    `UPDATE users SET tenant_id = $1, system_role_id = $2 WHERE id = $3`,
                    [userTenantId, adminRoleResult.rows[0].id, user.id]
                );
                
                // Associate user with tenant using user_roles table
                await client.query(
                    `INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
                     VALUES ($1, $2, $3, $4)`,
                    [user.id, adminRoleResult.rows[0].id, userTenantId, user.id]
                );
            } else if (tenantId && !isOrganizationCreator) {
                // Verify tenant exists
                const tenantCheck = await client.query(
                    'SELECT id FROM tenants WHERE id = $1',
                    [tenantId]
                );
                
                if (tenantCheck.rows.length === 0) {
                    throw new ForbiddenException('Invalid organization ID');
                }
                
                userTenantId = tenantId;
                
                // Create or get a tenant-specific member role for SaaS isolation
                let memberRoleResult;
                try {
                    // Look for existing tenant-specific member role
                    const existingRoleQuery = `
                        SELECT id FROM roles 
                        WHERE LOWER(name) = LOWER($1) AND tenant_id = $2
                        LIMIT 1
                    `;
                    const existingRole = await client.query(existingRoleQuery, ['tenant-member', userTenantId]);
                    
                    if (existingRole.rows.length > 0) {
                        // Use existing tenant-specific member role
                        memberRoleResult = existingRole;
                    } else {
                        // Create new TENANT-SPECIFIC member role (SaaS isolation)
                        memberRoleResult = await client.query(
                            `INSERT INTO roles (name, description, tenant_id, is_system, created_by)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING id`,
                            [
                                'tenant-member',
                                'Standard member role for this tenant/organization only',
                                userTenantId, // ✅ TENANT-SPECIFIC role for SaaS isolation
                                false, // ✅ NOT a system role - tenant-scoped only
                                user.id
                            ]
                        );
                        
                        // ✅ FIX: Assign basic permissions to the new tenant-member role
                        const memberPermissions = [
                            'users:read', 'users:list',
                            'roles:read', 'roles:list',
                            'permissions:read'
                        ];
                        
                        for (const permissionName of memberPermissions) {
                            const permissionResult = await client.query(
                                `SELECT id FROM permissions WHERE name = $1`,
                                [permissionName]
                            );
                            
                            if (permissionResult.rows.length > 0) {
                                await client.query(
                                    `INSERT INTO role_permissions (role_id, permission_id)
                                     VALUES ($1, $2)
                                     ON CONFLICT (role_id, permission_id) DO NOTHING`,
                                    [memberRoleResult.rows[0].id, permissionResult.rows[0].id]
                                );
                            }
                        }
                    }
                } catch (roleError) {
                    // If role creation fails, try to find tenant-specific member role
                    const fallbackRoleQuery = `
                        SELECT id FROM roles 
                        WHERE LOWER(name) = LOWER($1) AND tenant_id = $2
                        LIMIT 1
                    `;
                    memberRoleResult = await client.query(fallbackRoleQuery, ['tenant-member', userTenantId]);
                    
                    if (memberRoleResult.rows.length === 0) {
                        throw new BadRequestException('Unable to create or find member role');
                    }
                }
                
                // Update user with tenant_id and system_role_id
                await client.query(
                    `UPDATE users SET tenant_id = $1, system_role_id = $2 WHERE id = $3`,
                    [userTenantId, memberRoleResult.rows[0].id, user.id]
                );
                
                // Join existing organization as member using user_roles table
                await client.query(
                    `INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
                     VALUES ($1, $2, $3, $4)`,
                    [user.id, memberRoleResult.rows[0].id, userTenantId, user.id]
                );
            } else {
                // Default case: Create user without tenant assignment
                // This can happen when joining without specifying tenantId
                throw new BadRequestException('Please specify either organizationName (for new org) or tenantId (for existing org)');
            }

            await client.query('COMMIT');

            // Auto-login after signup
            const loginData = {
                email: data.email,
                password: data.password,
                tenantId: userTenantId
            };
            
            return await this.login(req, loginData);
            
        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Error during rollback:', rollbackError);
            }
            
            if (error.code === '23505') { // PostgreSQL unique violation
                // Check if it's specifically an email constraint violation
                if (error.constraint && error.constraint.includes('email')) {
                    throw new ForbiddenException('A user with this email already exists');
                }
                
                // Check if it's a role name constraint violation
                if (error.table === 'roles' && error.constraint && error.constraint.includes('name')) {
                    throw new BadRequestException('Error creating default roles for organization');
                }
                
                // Generic constraint violation
                throw new BadRequestException('A duplicate entry was detected. Please check your input and try again.');
            }
            
            // Log the error for debugging
            console.error('Error during signup:', error);
            throw error;
        } finally {
            try {
                client.release();
            } catch (releaseError) {
                console.error('Error releasing client:', releaseError);
            }
        }
    }

    async login(req, data: LoginDto) {
        const { email, password, mfaToken, tenantId, tenantName, systemRole } = data;
        
        // Find user by email
        const userResult = await this.databaseService.query<User>(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            throw new UnauthorizedException('Invalid credentials!');
        }
        
        const user = userResult.rows[0];
        
        // Check if account is locked


        // Verify password
        if (!(await bcrypt.compare(password, user.password))) {
            // Update failed login attempts
            await this.databaseService.query(
                `UPDATE user_login_details 
                 SET failed_attempts = failed_attempts + 1, 
                     last_failed_ip = $1, 
                     last_failed_at = NOW() 
                 WHERE user_id = $2`,
                [req.ip, user.id]
            );
            
            // Lock account after 5 failed attempts
            const loginDetails = await this.databaseService.query(
                'SELECT failed_attempts FROM user_login_details WHERE user_id = $1',
                [user.id]
            );
            
            if (loginDetails.rows[0]?.failed_attempts >= 5) {
                
            }
            
            throw new UnauthorizedException('Invalid credentials!');
        }

        // Get user login details
        const loginDetailsResult = await this.databaseService.query<UserLoginDetails>(
            'SELECT * FROM user_login_details WHERE user_id = $1',
            [user.id]
        );
        const userLoginDetails = loginDetailsResult.rows[0];

        // Check IP whitelist
        const isIpWhitelisted = userLoginDetails.whitelisted_ip.includes(req.ip);
        
        // Handle MFA verification
        let mfaVerified = false;
        
        // If new IP detected, require MFA
        if (!isIpWhitelisted) {
            if (!mfaToken) {
                throw new ForbiddenException('New IP detected. MFA token is required');
            }
            
            // Check if MFA is set up
            const mfaResult = await this.databaseService.query<MFA>(
                'SELECT * FROM mfa WHERE user_id = $1',
                [user.id]
            );
            
            if (mfaResult.rows.length === 0) {
                throw new ForbiddenException('Please set up MFA first for new IP access');
            }
            
            const mfa = mfaResult.rows[0];
            const isValid = await this.authHelper.verifyMfaToken(mfa.secret, mfaToken);
            
            if (!isValid) {
                throw new ForbiddenException('Invalid MFA token');
            }
            
            mfaVerified = true;
            
            // Add IP to whitelist after successful MFA
            await this.databaseService.query(
                `UPDATE user_login_details 
                 SET whitelisted_ip = array_append(whitelisted_ip, $1)
                 WHERE user_id = $2 AND NOT ($1 = ANY(whitelisted_ip))`,
                [req.ip, user.id]
            );
        } else if (user.is_mfa_enabled) {
            // Regular MFA check for whitelisted IPs with MFA enabled
            if (!mfaToken) {
                throw new ForbiddenException('MFA token is required');
            }
            
            const mfaResult = await this.databaseService.query<MFA>(
                'SELECT * FROM mfa WHERE user_id = $1',
                [user.id]
            );
            
            if (mfaResult.rows.length === 0) {
                throw new ForbiddenException('MFA is not set up for this user');
            }
            
            const mfa = mfaResult.rows[0];
            const isValid = await this.authHelper.verifyMfaToken(mfa.secret, mfaToken);
            if (!isValid) {
                throw new ForbiddenException('Invalid MFA token');
            }
            
            mfaVerified = true;
        }

        // Handle tenant selection
        let selectedTenantId = tenantId;
        let selectedTenantName = tenantName;
        
        if (tenantName && !tenantId) {
            // Look up tenant by name
            const tenantResult = await this.databaseService.query(
                'SELECT id, name FROM tenants WHERE name = $1',
                [tenantName]
            );
            if (tenantResult.rows.length > 0) {
                selectedTenantId = tenantResult.rows[0].id;
                selectedTenantName = tenantResult.rows[0].name;
            }
        }
        
        // ✅ SECURE: Check tenant access patterns before auto-selection
        if (!selectedTenantId) {
            // First, check how many tenants user has access to
            const userTenantsResult = await this.databaseService.query(
                `SELECT t.id, t.name, ur.assigned_at
                 FROM user_roles ur 
                 JOIN tenants t ON ur.tenant_id = t.id 
                 WHERE ur.user_id = $1 
                 ORDER BY ur.assigned_at ASC`,
                [user.id]
            );
            
            const userTenants = userTenantsResult.rows;
            
            if (userTenants.length === 0) {
                throw new ForbiddenException('User is not assigned to any tenant');
            } else if (userTenants.length === 1) {
                // ✅ SAFE: User only has access to one tenant
                selectedTenantId = userTenants[0].id;
                selectedTenantName = userTenants[0].name;
            } else {
                // 🚨 SECURITY: User has multiple tenants - require explicit selection
                throw new BadRequestException({
                    message: 'Multiple tenants found. Please specify tenantId or tenantName in login request.',
                    availableTenants: userTenants.map(t => ({
                        id: t.id,
                        name: t.name
                    }))
                });
            }
        }
        
        // Verify user has access to the tenant
        let tenantInfo = null;
        if (selectedTenantId) {
            const userTenantResult = await this.databaseService.query(
                `SELECT ur.*, t.name as tenant_name
                 FROM user_roles ur 
                 JOIN tenants t ON ur.tenant_id = t.id 
                 WHERE ur.user_id = $1 AND ur.tenant_id = $2`,
                [user.id, selectedTenantId]
            );
            
            if (userTenantResult.rows.length === 0) {
                throw new ForbiddenException('User does not have access to this tenant');
            }
            
            tenantInfo = {
                id: selectedTenantId,
                name: userTenantResult.rows[0].tenant_name
            };
        }
        
        // Handle system role validation
        let userSystemRole = null;
        let userSystemRoleId = null;
        
        // Get user's role (system roles for platform owners, tenant roles for customers)
        const systemRoleQuery = `
            SELECT r.id, r.name, r.description, r.is_system, r.tenant_id
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1 
            ${selectedTenantId ? 'AND ur.tenant_id = $2' : ''}
            ORDER BY r.is_system DESC, r.name
            LIMIT 1
        `;
        
        const queryParams = selectedTenantId ? [user.id, selectedTenantId] : [user.id];
        const userRoleResult = await this.databaseService.query(systemRoleQuery, queryParams);
        
        if (userRoleResult.rows.length > 0) {
            const role = userRoleResult.rows[0];
            
            // Map roles to 2-level company hierarchy
            // All roles are now tenant-specific (no platform-wide access)
            if (role.name === 'tenant-admin') {
                userSystemRole = 'ADMIN'; // Level 2: Company Admin (can manage their company)
            } else if (role.name === 'tenant-member') {
                userSystemRole = 'END_USER'; // Level 1: End User (employee within company)
            } else {
                userSystemRole = role.name; // Custom role name
            }
            
            userSystemRoleId = role.id;
            
            // If a specific systemRole was requested, validate user has it
            if (systemRole && userSystemRole.toLowerCase() !== systemRole.toLowerCase()) {
                throw new ForbiddenException('User does not have the specified system role');
            }
        } else if (systemRole) {
            // If a specific system role was requested but user doesn't have any
            throw new ForbiddenException('User does not have the specified system role');
        }

        // Update successful login
        await this.databaseService.query(
            `UPDATE user_login_details 
             SET last_login = NOW(), failed_attempts = 0 
             WHERE user_id = $1`,
            [user.id]
        );

        // Generate tokens with tenant context
        const logindata = {
            id: user.id,
            tenantId: selectedTenantId
        };

        let { accessToken, refreshToken } = await this.authHelper.generateTokens(logindata, req);
        
        // Get permissions if tenant is selected
        let permissions = [];
        if (selectedTenantId) {
            const permissionsResult = await this.databaseService.query(
                `SELECT DISTINCT p.* 
                 FROM permissions p
                 JOIN role_permissions rp ON p.id = rp.permission_id
                 JOIN user_roles ur ON rp.role_id = ur.role_id
                 WHERE ur.user_id = $1 AND ur.tenant_id = $2
                 UNION
                 SELECT DISTINCT p.*
                 FROM permissions p
                 JOIN user_permissions up ON p.id = up.permission_id
                 WHERE up.user_id = $1 AND up.is_granted = true`,
                [user.id, selectedTenantId]
            );
            permissions = permissionsResult.rows;
        }
        
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                tenantId: selectedTenantId,
                tenant: tenantInfo,
                systemRole: userSystemRole,
                systemRoleId: userSystemRoleId,
                permissions: permissions
            }
        };
    }

    async disableUserMFA(req) {
        const userId = req.user.id;
        
        // Delete MFA record
        await this.databaseService.query(
            'DELETE FROM mfa WHERE user_id = $1',
            [userId]
        );
        
        // Update user MFA status
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
            const mfa = mfaResult.rows[0];
            const imageBuffer = Buffer.from(mfa.qr_base64.split(',')[1], 'base64');
            return imageBuffer;
        }

        let { secret, qrCode } = await this.authHelper.generateMfaSecret(req.user.email);
        
        // Create MFA record
        await this.databaseService.query(
            `INSERT INTO mfa (user_id, secret, qr_base64, is_setup_complete)
             VALUES ($1, $2, $3, $4)`,
            [userId, secret, qrCode, false]
        );

        // Update user to enable MFA
        await this.databaseService.query(
            'UPDATE users SET is_mfa_enabled = $1 WHERE id = $2',
            [true, userId]
        );

        const imgBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
        return imgBuffer;
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

    async initiateForgotPassword(data: ForgotPasswordInitDto) {
        const { email, phoneNumber } = data;
        
        // Check if user exists
        const userResult = await this.databaseService.query<User>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            throw new UnauthorizedException('User not found');
        }
        
        const user = userResult.rows[0];
        
        // Generate OTP (6 digit code)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in database with expiry (15 minutes)
        await this.databaseService.query(
            `INSERT INTO password_reset_otps (user_id, otp, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '15 minutes')
             ON CONFLICT (user_id) 
             DO UPDATE SET otp = $2, expires_at = NOW() + INTERVAL '15 minutes'`,
            [user.id, otp]
        );
        
        // TODO: Send OTP via email/SMS service
        // await this.emailService.sendOTP(email, otp);
        
        return {
            message: 'OTP sent successfully to your email'
            // Don't return OTP in production
        };
    }

    async verifyOtp(data: VerifyOtpDto) {
        const { email, otp } = data;
        
        // Get user
        const userResult = await this.databaseService.query<User>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            throw new UnauthorizedException('User not found');
        }
        
        const user = userResult.rows[0];
        
        // Verify OTP
        const otpResult = await this.databaseService.query(
            `SELECT * FROM password_reset_otps 
             WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()`,
            [user.id, otp]
        );
        
        if (otpResult.rows.length === 0) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }
        
        return {
            message: 'OTP verified successfully',
            isValid: true
        };
    }

    async resetPassword(data: ResetPasswordDto) {
        const { email, otp, newPassword, confirmPassword } = data;
        
        if (newPassword !== confirmPassword) {
            throw new ForbiddenException('Passwords do not match');
        }
        
        // Get user
        const userResult = await this.databaseService.query<User>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            throw new UnauthorizedException('User not found');
        }
        
        const user = userResult.rows[0];
        
        // Verify OTP again
        const otpResult = await this.databaseService.query(
            `SELECT * FROM password_reset_otps 
             WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()`,
            [user.id, otp]
        );
        
        if (otpResult.rows.length === 0) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await this.databaseService.query(
            'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, user.id]
        );
        
        // Delete OTP
        await this.databaseService.query(
            'DELETE FROM password_reset_otps WHERE user_id = $1',
            [user.id]
        );
        
        return {
            message: 'Password reset successfully'
        };
    }

    async getMfaSetupForLogin(data: MfaSetupRequestDto) {
        const { email, password } = data;
        
        // Verify credentials first
        const userResult = await this.databaseService.query<User>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            throw new UnauthorizedException('Invalid credentials');
        }
        
        const user = userResult.rows[0];
        
        if (!(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }
        
        if (!user.is_mfa_enabled) {
            throw new ForbiddenException('MFA is not enabled for this user');
        }
        
        // Check if MFA setup exists
        const mfaResult = await this.databaseService.query<MFA>(
            'SELECT * FROM mfa WHERE user_id = $1',
            [user.id]
        );
        
        if (mfaResult.rows.length === 0) {
            // Generate new MFA setup
            const { secret, qrCode } = await this.authHelper.generateMfaSecret(user.email);
            
            // Store MFA details
            await this.databaseService.query(
                `INSERT INTO mfa (user_id, secret, qr_base64, is_setup_complete)
                 VALUES ($1, $2, $3, $4)`,
                [user.id, secret, qrCode, false]
            );
            
            return {
                qrCodeUrl: qrCode,
                secret: secret,
                instructions: 'Scan this QR code with your authenticator app to complete MFA setup'
            };
        }
        
        const mfa = mfaResult.rows[0];
        
        // If setup is already complete, don't show QR code
        if (mfa.is_setup_complete) {
            throw new ForbiddenException('MFA setup is already complete for this user');
        }
        
        return {
            qrCodeUrl: mfa.qr_base64,
            secret: mfa.secret,
            instructions: 'Scan this QR code with your authenticator app to complete MFA setup'
        };
    }

    async verifyMfaSetup(data: { email: string; password: string; mfaToken: string }) {
        const { email, password, mfaToken } = data;
        
        // Verify credentials
        const userResult = await this.databaseService.query<User>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            throw new UnauthorizedException('Invalid credentials');
        }
        
        const user = userResult.rows[0];
        
        if (!(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }
        
        // Get MFA details
        const mfaResult = await this.databaseService.query<MFA>(
            'SELECT * FROM mfa WHERE user_id = $1',
            [user.id]
        );
        
        if (mfaResult.rows.length === 0) {
            throw new ForbiddenException('MFA setup not found');
        }
        
        const mfa = mfaResult.rows[0];
        
        // Verify token
        const isValid = await this.authHelper.verifyMfaToken(mfa.secret, mfaToken);
        
        if (!isValid) {
            throw new UnauthorizedException('Invalid MFA token');
        }
        
        // Mark setup as complete
        await this.databaseService.query(
            'UPDATE mfa SET is_setup_complete = $1 WHERE user_id = $2',
            [true, user.id]
        );
        
        // Enable MFA for user
        await this.databaseService.query(
            'UPDATE users SET is_mfa_enabled = $1 WHERE id = $2',
            [true, user.id]
        );
        
        return {
            success: true,
            message: 'MFA setup completed successfully',
            setupComplete: true
        };
    }
}