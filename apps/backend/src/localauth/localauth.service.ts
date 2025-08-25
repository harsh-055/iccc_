import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AuthHelper } from './utils/auth.helper';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';
import {
  ForgotPasswordInitDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/forgot-password.dto';
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
    private authHelper: AuthHelper,
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
      phoneNumber,
      isOrganizationCreator,
      organizationName,
      organizationDescription,
    } = data;

    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new ForbiddenException('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userIp = req?.ip || req?.connection?.remoteAddress || 'unknown';

    // Use transaction for atomicity
    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');

      // Check if email already exists
      const existingUserResult = await client.query(
        'SELECT id, email, is_active FROM users WHERE LOWER(email) = LOWER($1)',
        [email],
      );

      // Check if any active user exists with this email
      const activeUsers = existingUserResult.rows.filter(
        (user) => user.is_active === true,
      );

      if (activeUsers.length > 0) {
        throw new ForbiddenException('A user with this email already exists');
      }

      // No parent user validation needed for simplified signup
      const validatedParentId = null;

      // Create user
      const userResult = await client.query<User>(
        `INSERT INTO users (email, first_name, last_name, phone_number, password, is_mfa_enabled, is_active, tenant_id, system_role_id, parent_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                 RETURNING *`,
        [
          email,
          firstName,
          lastName,
          phoneNumber || null,
          hashedPassword,
          false,
          true,
          null,
          null,
          validatedParentId,
        ],
      );
      const user = userResult.rows[0];

      // Create user login details
      await client.query(
        `INSERT INTO user_login_details (user_id, whitelisted_ip, failed_attempts, last_login)
                 VALUES ($1, $2::text[], $3, NOW())`,
        [user.id, [userIp], 0],
      );

      // Handle organization creation or joining
      let userTenantId = null;

      if (isOrganizationCreator && organizationName) {
        // Create new organization/tenant
        const tenantResult = await client.query(
          `INSERT INTO tenants (name, description, created_by)
                     VALUES ($1, $2, $3)
                     RETURNING *`,
          [organizationName, organizationDescription || null, user.id],
        );
        userTenantId = tenantResult.rows[0].id;

        // Create or find tenant-specific admin role for SaaS isolation
        let adminRoleResult;
        try {
          // Look for existing tenant-specific admin role first
          const existingRoleQuery = `
                        SELECT id FROM roles
                        WHERE LOWER(name) = LOWER($1) AND tenant_id = $2
                        LIMIT 1
                    `;
          const existingRole = await client.query(existingRoleQuery, [
            'Admin',
            userTenantId,
          ]);

          if (existingRole.rows.length > 0) {
            // Use existing tenant-specific admin role
            adminRoleResult = existingRole;
          } else {
            // Create new TENANT-SPECIFIC system roles (SaaS isolation)
            // Create Super Administrator role
            const superAdminRoleResult = await client.query(
              `INSERT INTO roles (name, description, tenant_id, is_system, created_by)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING id`,
              [
                'Super Administrator',
                'Monitors and Hosts Management Permissions',
                userTenantId, // ✅ TENANT-SPECIFIC system role
                true, // ✅ IS a system role but tenant-scoped
                user.id,
              ],
            );

            // Create Administrator role
            const adminRoleInsertResult = await client.query(
              `INSERT INTO roles (name, description, tenant_id, is_system, created_by)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING id`,
              [
                'Administrator',
                'Administrator role with all permissions',
                userTenantId, // ✅ TENANT-SPECIFIC system role
                true, // ✅ IS a system role but tenant-scoped
                user.id,
              ],
            );

            // Create User Admin role
            const userAdminRoleResult = await client.query(
              `INSERT INTO roles (name, description, tenant_id, is_system, created_by)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING id`,
              [
                'User Admin',
                ' user admin role with all permissions',
                userTenantId, // ✅ TENANT-SPECIFIC system role
                true, // ✅ IS a system role but tenant-scoped
                user.id,
              ],
            );

            // Permission assignments are now handled by the role-permission mapping below

            // Assign permissions based on role mapping
            const { getPermissionsForRole } = await import('../permissions/config/role-permission-mapping');
            
            // Assign permissions to Super Administrator
            const superAdminPermissions = getPermissionsForRole('Super Administrator');
            for (const permissionName of superAdminPermissions) {
              const permissionResult = await client.query(
                `SELECT id FROM permissions WHERE name = $1`,
                [permissionName],
              );

              if (permissionResult.rows.length > 0) {
                await client.query(
                  `INSERT INTO role_permissions (role_id, permission_id, assigned_at)
                                 VALUES ($1, $2, NOW())
                                 ON CONFLICT (role_id, permission_id) DO NOTHING`,
                  [superAdminRoleResult.rows[0].id, permissionResult.rows[0].id],
                );
              }
            }

            // Assign permissions to Administrator
            const adminPermissions = getPermissionsForRole('Administrator');
            for (const permissionName of adminPermissions) {
              const permissionResult = await client.query(
                `SELECT id FROM permissions WHERE name = $1`,
                [permissionName],
              );

              if (permissionResult.rows.length > 0) {
                await client.query(
                  `INSERT INTO role_permissions (role_id, permission_id, assigned_at)
                                 VALUES ($1, $2, NOW())
                                 ON CONFLICT (role_id, permission_id) DO NOTHING`,
                  [adminRoleInsertResult.rows[0].id, permissionResult.rows[0].id],
                );
              }
            }

            // Assign permissions to User Admin
            const userAdminPermissions = getPermissionsForRole('User Admin');
            for (const permissionName of userAdminPermissions) {
              const permissionResult = await client.query(
                `SELECT id FROM permissions WHERE name = $1`,
                [permissionName],
              );

              if (permissionResult.rows.length > 0) {
                await client.query(
                  `INSERT INTO role_permissions (role_id, permission_id, assigned_at)
                                 VALUES ($1, $2, NOW())
                                 ON CONFLICT (role_id, permission_id) DO NOTHING`,
                  [userAdminRoleResult.rows[0].id, permissionResult.rows[0].id],
                );
              }
            }

            // Use Administrator role for the new user
            adminRoleResult = adminRoleInsertResult;

            // ✅ Database trigger will automatically assign manage permissions to Admin roles
            // No need to manually assign permissions here anymore!
          }
        } catch (roleError) {
          // If role creation fails, try to find tenant-specific admin role
          const fallbackRoleQuery = `
                        SELECT id FROM roles 
                        WHERE LOWER(name) = LOWER($1) AND tenant_id = $2
                        LIMIT 1
                    `;
          adminRoleResult = await client.query(fallbackRoleQuery, [
            'Admin',
            userTenantId,
          ]);

          if (adminRoleResult.rows.length === 0) {
            throw new BadRequestException(
              'Unable to create or find admin role',
            );
          }
        }

        // Update user with tenant_id and system_role_id
        await client.query(
          `UPDATE users SET tenant_id = $1, system_role_id = $2 WHERE id = $3`,
          [userTenantId, adminRoleResult.rows[0].id, user.id],
        );

        // Associate user with tenant using user_roles table
        await client.query(
          `INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
                     VALUES ($1, $2, $3, $4)`,
          [user.id, adminRoleResult.rows[0].id, userTenantId, user.id],
        );
      } else {
        // Default case: Create user without tenant assignment
        // This can happen when not creating an organization
        throw new BadRequestException(
          'Please set isOrganizationCreator to true and provide organizationName to create a new organization',
        );
      }



      await client.query('COMMIT');

      // Auto-login after signup
      const loginData = {
        email: data.email,
        password: data.password,
        tenantId: userTenantId,
      };

      return await this.login(req, loginData);
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }

      if (error.code === '23505') {
        // PostgreSQL unique violation
        // Check if it's specifically an email constraint violation
        if (error.constraint && error.constraint.includes('email')) {
          throw new ForbiddenException('A user with this email already exists');
        }

        // Check if it's a role name constraint violation
        if (
          error.table === 'roles' &&
          error.constraint &&
          error.constraint.includes('name')
        ) {
          throw new BadRequestException(
            'Error creating default roles for organization',
          );
        }

        // Generic constraint violation
        throw new BadRequestException(
          'A duplicate entry was detected. Please check your input and try again.',
        );
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
    const { email, password } = data;
    
    // Ensure req object exists and has required properties
    const requestIp = req?.ip || req?.connection?.remoteAddress || 'unknown';

    // Find user by email
    const userResult = await this.databaseService.query<User>(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email],
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
        [requestIp, user.id],
      );

      // Lock account after 5 failed attempts
      const loginDetails = await this.databaseService.query(
        'SELECT failed_attempts FROM user_login_details WHERE user_id = $1',
        [user.id],
      );

      if (loginDetails.rows[0]?.failed_attempts >= 5) {
      }

      throw new UnauthorizedException('Invalid credentials!');
    }

    // Get user login details
    const loginDetailsResult =
      await this.databaseService.query<UserLoginDetails>(
        'SELECT * FROM user_login_details WHERE user_id = $1',
        [user.id],
      );
    const userLoginDetails = loginDetailsResult.rows[0];

    // Check IP whitelist
    const isIpWhitelisted = userLoginDetails.whitelisted_ip.includes(requestIp);

    // MFA verification commented out for now
    let mfaVerified = true; // Set to true to bypass MFA

    // // Handle MFA verification
    // let mfaVerified = false;

    // // If new IP detected, require MFA
    // if (!isIpWhitelisted) {
    //   if (!mfaToken) {
    //     throw new ForbiddenException('New IP detected. MFA token is required');
    //   }

    //   // Check if MFA is set up
    //   const mfaResult = await this.databaseService.query<MFA>(
    //     'SELECT * FROM mfa WHERE user_id = $1',
    //     [user.id],
    //   );

    //   if (mfaResult.rows.length === 0) {
    //     throw new ForbiddenException(
    //       'Please set up MFA first for new IP access',
    //     );
    //   }

    //   const mfa = mfaResult.rows[0];
    //   const isValid = await this.authHelper.verifyMfaToken(
    //     mfa.secret,
    //     mfaToken,
    //   );

    //   if (!isValid) {
    //     throw new ForbiddenException('Invalid MFA token');
    //   }

    //   mfaVerified = true;

    //   // Add IP to whitelist after successful MFA
    //   await this.databaseService.query(
    //     `UPDATE user_login_details 
    //              SET whitelisted_ip = array_append(whitelisted_ip, $1)
    //              WHERE user_id = $2 AND NOT ($1 = ANY(whitelisted_ip))`,
    //     [req.ip, user.id],
    //   );
    // } else if (user.is_mfa_enabled) {
    //   // Regular MFA check for whitelisted IPs with MFA enabled
    //   if (!mfaToken) {
    //     throw new ForbiddenException('MFA token is required');
    //   }

    //   const mfaResult = await this.databaseService.query<MFA>(
    //     'SELECT * FROM mfa WHERE user_id = $1',
    //     [user.id],
    //   );

    //   if (mfaResult.rows.length === 0) {
    //     throw new ForbiddenException('MFA is not set up for this user');
    //   }

    //   const mfa = mfaResult.rows[0];
    //   const isValid = await this.authHelper.verifyMfaToken(
    //     mfa.secret,
    //     mfaToken,
    //   );
    //   if (!isValid) {
    //     throw new ForbiddenException('Invalid MFA token');
    //   }

    //   mfaVerified = true;
    // }

    // Auto-select tenant for user
    let selectedTenantId = null;
    let selectedTenantName = null;

    // Check how many tenants user has access to
    const userTenantsResult = await this.databaseService.query(
      `SELECT t.id, t.name, ur.assigned_at
               FROM user_roles ur 
               JOIN tenants t ON ur.tenant_id = t.id 
               WHERE ur.user_id = $1 
               ORDER BY ur.assigned_at ASC`,
      [user.id],
    );

    const userTenants = userTenantsResult.rows;

    if (userTenants.length === 0) {
      throw new ForbiddenException('User is not assigned to any tenant');
    } else if (userTenants.length === 1) {
      // User only has access to one tenant
      selectedTenantId = userTenants[0].id;
      selectedTenantName = userTenants[0].name;
    } else {
      // User has multiple tenants - select the first one
      selectedTenantId = userTenants[0].id;
      selectedTenantName = userTenants[0].name;
    }

    // Verify user has access to the tenant
    let tenantInfo = null;
    if (selectedTenantId) {
      const userTenantResult = await this.databaseService.query(
        `SELECT ur.*, t.name as tenant_name
                 FROM user_roles ur 
                 JOIN tenants t ON ur.tenant_id = t.id 
                 WHERE ur.user_id = $1 AND ur.tenant_id = $2`,
        [user.id, selectedTenantId],
      );

      if (userTenantResult.rows.length === 0) {
        throw new ForbiddenException(
          'User does not have access to this tenant',
        );
      }

      tenantInfo = {
        id: selectedTenantId,
        name: userTenantResult.rows[0].tenant_name,
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

    const queryParams = selectedTenantId
      ? [user.id, selectedTenantId]
      : [user.id];
    const userRoleResult = await this.databaseService.query(
      systemRoleQuery,
      queryParams,
    );

    if (userRoleResult.rows.length > 0) {
      const role = userRoleResult.rows[0];

      // Map roles to 2-level company hierarchy
      // All roles are now tenant-specific (no platform-wide access)
      if (role.name === 'Admin') {
        userSystemRole = 'ADMIN'; // Level 2: Company Admin (can manage their company)
      } else if (role.name === 'tenant-member') {
        userSystemRole = 'END_USER'; // Level 1: End User (employee within company)
      } else {
        userSystemRole = role.name; // Custom role name
      }

      userSystemRoleId = role.id;
    }

    // Update successful login
    await this.databaseService.query(
      `UPDATE user_login_details 
             SET last_login = NOW(), failed_attempts = 0 
             WHERE user_id = $1`,
      [user.id],
    );

    // Generate tokens with tenant context
    const logindata = {
      id: user.id,
      tenantId: selectedTenantId,
    };

    const { accessToken, refreshToken } = await this.authHelper.generateTokens(
      logindata,
      req,
      true, // Force new token generation
    );

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
        [user.id, selectedTenantId],
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
        permissions: permissions,
      },
    };
  }

  async disableUserMFA(req) {
    const userId = req.user.id;

    // Delete MFA record
    await this.databaseService.query('DELETE FROM mfa WHERE user_id = $1', [
      userId,
    ]);

    // Update user MFA status
    await this.databaseService.query(
      'UPDATE users SET is_mfa_enabled = $1 WHERE id = $2',
      [false, userId],
    );

    return { message: 'MFA disabled successfully' };
  }

  async activateUserMFA(req) {
    const userId = req.user.id;

    // Check if MFA exists
    const mfaResult = await this.databaseService.query<MFA>(
      'SELECT * FROM mfa WHERE user_id = $1',
      [userId],
    );

    if (mfaResult.rows.length > 0) {
      const mfa = mfaResult.rows[0];
      const imageBuffer = Buffer.from(mfa.qr_base64.split(',')[1], 'base64');
      return imageBuffer;
    }

    const { secret, qrCode } = await this.authHelper.generateMfaSecret(
      req.user.email,
    );

    // Create MFA record
    await this.databaseService.query(
      `INSERT INTO mfa (user_id, secret, qr_base64, is_setup_complete)
             VALUES ($1, $2, $3, $4)`,
      [userId, secret, qrCode, false],
    );

    // Update user to enable MFA
    await this.databaseService.query(
      'UPDATE users SET is_mfa_enabled = $1 WHERE id = $2',
      [true, userId],
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
      [req.ip, userId],
    );

    // Unlock user account

    return { message: 'MFA verified successfully' };
  }

  async refreshToken(req: Request, data) {
    const { accessToken } = await this.authHelper.refreshAccessToken(
      data.refreshToken,
      req,
    );
    return { accessToken };
  }

  async getSessions(req: any) {
    const sessions = await this.authHelper.getAllActiveSessions(req.user.id);

    return sessions.map((session) => ({
      ip: session.ip,
      device: session.device,
      loggedInAt: session.logged,
    }));
  }

  async logout(req: Request) {
    const { message } = await this.authHelper.logout(req);
    return { message };
  }

  async initiateForgotPassword(data: ForgotPasswordInitDto) {
    const { email, phoneNumber } = data;

    // Check if user exists
    const userResult = await this.databaseService.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email],
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
      [user.id, otp],
    );

    // TODO: Send OTP via email/SMS service
    // await this.emailService.sendOTP(email, otp);

    return {
      message: 'OTP sent successfully to your email',
      // Don't return OTP in production
    };
  }

  async verifyOtp(data: VerifyOtpDto) {
    const { email, otp } = data;

    // Get user
    const userResult = await this.databaseService.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    const user = userResult.rows[0];

    // Verify OTP
    const otpResult = await this.databaseService.query(
      `SELECT * FROM password_reset_otps 
             WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()`,
      [user.id, otp],
    );

    if (otpResult.rows.length === 0) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    return {
      message: 'OTP verified successfully',
      isValid: true,
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
      [email],
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    const user = userResult.rows[0];

    // Verify OTP again
    const otpResult = await this.databaseService.query(
      `SELECT * FROM password_reset_otps 
             WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()`,
      [user.id, otp],
    );

    if (otpResult.rows.length === 0) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.databaseService.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id],
    );

    // Delete OTP
    await this.databaseService.query(
      'DELETE FROM password_reset_otps WHERE user_id = $1',
      [user.id],
    );

    return {
      message: 'Password reset successfully',
    };
  }

  async getMfaSetupForLogin(data: MfaSetupRequestDto) {
    const { email, password } = data;

    // Verify credentials first
    const userResult = await this.databaseService.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email],
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
      [user.id],
    );

    if (mfaResult.rows.length === 0) {
      // Generate new MFA setup
      const { secret, qrCode } = await this.authHelper.generateMfaSecret(
        user.email,
      );

      // Store MFA details
      await this.databaseService.query(
        `INSERT INTO mfa (user_id, secret, qr_base64, is_setup_complete)
                 VALUES ($1, $2, $3, $4)`,
        [user.id, secret, qrCode, false],
      );

      return {
        qrCodeUrl: qrCode,
        secret: secret,
        instructions:
          'Scan this QR code with your authenticator app to complete MFA setup',
      };
    }

    const mfa = mfaResult.rows[0];

    // If setup is already complete, don't show QR code
    if (mfa.is_setup_complete) {
      throw new ForbiddenException(
        'MFA setup is already complete for this user',
      );
    }

    return {
      qrCodeUrl: mfa.qr_base64,
      secret: mfa.secret,
      instructions:
        'Scan this QR code with your authenticator app to complete MFA setup',
    };
  }

  async verifyMfaSetup(data: {
    email: string;
    password: string;
    mfaToken: string;
  }) {
    const { email, password, mfaToken } = data;

    // Verify credentials
    const userResult = await this.databaseService.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email],
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
      [user.id],
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
      [true, user.id],
    );

    // Enable MFA for user
    await this.databaseService.query(
      'UPDATE users SET is_mfa_enabled = $1 WHERE id = $2',
      [true, user.id],
    );

    return {
      success: true,
      message: 'MFA setup completed successfully',
      setupComplete: true,
    };
  }
}
