import { BadRequestException, Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, PaginatedResponseDto, SuspendUserDto, BulkCreateUsersDto } from './dto/index';
import { LoggerService } from '../logger/logger.service';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../../database/database.service';
import { TemporaryPasswordService } from './temporary-password.service';
import { RbacService } from '../rbac/rbac.service';
import { LensMailService } from '../utils/mail/utils.lensMail.service';

// Add this type declaration after the imports
type UserWithSuspension = {
  isSuspended: boolean;
};

@Injectable()
export class UserService {
  constructor(
    private db: DatabaseService,
    private logger: LoggerService,
    private temporaryPasswordService: TemporaryPasswordService,
    @Inject(forwardRef(() => RbacService))
    private rbacService: RbacService,
    private mailService: LensMailService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Generate password if not provided
      let password = createUserDto.password;
      if (!password) {
        password = this.temporaryPasswordService.generateTemporaryPassword();
      }
      
      const hashedPassword = await this.hashPassword(password);
      const accountId = await this.generateUniqueAccountId();

      // Validate userRole if provided (simplified to just Admin or User)
      let validatedRoleId: string | null = null;
      let roleLevel = 1; // Default to User level
      
      if (createUserDto.userRole) {
        const roleQuery = `
          SELECT id, name, description 
          FROM roles 
          WHERE id = $1 AND isActive = true
        `;
        const roleResult = await client.query(roleQuery, [createUserDto.userRole]);
        
        if (roleResult.rows.length === 0) {
          throw new BadRequestException(`Role with ID ${createUserDto.userRole} not found or inactive`);
        }
        
        validatedRoleId = createUserDto.userRole;
        const roleName = roleResult.rows[0].name.toUpperCase();
        roleLevel = roleName.includes('ADMIN') ? 2 : 1;
      }

      // Validate parent if provided (simplified hierarchy)
      if (createUserDto.parent) {
        const parentQuery = `
          SELECT u.id, r.name as roleName
          FROM users u
          LEFT JOIN roles r ON u.roleId = r.id
          WHERE u.id = $1 AND u.isActive = true
        `;
        const parentResult = await client.query(parentQuery, [createUserDto.parent]);
        
        if (parentResult.rows.length === 0) {
          throw new BadRequestException(`Parent user with ID ${createUserDto.parent} not found or inactive`);
        }
        
        // Check if parent is admin (only admins can create users)
        const parentRoleName = parentResult.rows[0].rolename?.toUpperCase() || '';
        if (!parentRoleName.includes('ADMIN')) {
          throw new ForbiddenException('Only administrators can create new users');
        }
      }

      // If no role specified, create/find default User role
      if (!validatedRoleId) {
        const defaultRoleQuery = `
          SELECT id FROM roles 
          WHERE name = 'User' AND isActive = true
          LIMIT 1
        `;
        const defaultRoleResult = await client.query(defaultRoleQuery);
        
        if (defaultRoleResult.rows.length === 0) {
          // Create default User role if it doesn't exist
          const createRoleQuery = `
            INSERT INTO roles (id, name, description, isActive, createdAt, updatedAt)
            VALUES (gen_random_uuid(), 'User', 'Default user role with basic permissions', true, NOW(), NOW())
            RETURNING id
          `;
          const newRoleResult = await client.query(createRoleQuery);
          validatedRoleId = newRoleResult.rows[0].id;
        } else {
          validatedRoleId = defaultRoleResult.rows[0].id;
        }
      }

      // Insert the user
      const insertUserQuery = `
        INSERT INTO users (
          id, firstName, lastName, email, password, accountId, phoneNumber,
          roleId, parentId, isActive, isMfaEnabled, isLocked, isSuspended,
          createdAt, updatedAt, createdBy
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, false,
          NOW(), NOW(), $11
        ) RETURNING id, email, firstName, lastName, accountId
      `;

      const userValues = [
        createUserDto.firstName,
        createUserDto.lastName,
        createUserDto.email,
        hashedPassword,
        accountId,
        createUserDto.contactNumber || null,
        validatedRoleId,
        createUserDto.parent || null,
        false, // isMfaEnabled default
        false, // isLocked default
        // createUserDto.createdBy || null
      ];

      const userResult = await client.query(insertUserQuery, userValues);
      const newUser = userResult.rows[0];

      await client.query('COMMIT');

      // Clear RBAC cache for the new user
      await this.rbacService.clearUserPermissionCache(newUser.id);

      // Send temporary password if one was generated
      if (!createUserDto.password) {
        this.logger.log(`Temporary password generated for user ${newUser.email}`, 'UserService', newUser.id);
        
        const fullName = `${newUser.firstname} ${newUser.lastname}`;
        const emailSubject = 'Welcome to the Platform - Your Account Details';
        const emailBody = `
Hello ${fullName},

Welcome to our platform! Your account has been created successfully.

Here are your login credentials:
• Email: ${newUser.email}
• Temporary Password: ${password}

🔐 IMPORTANT SECURITY NOTICE:
This is a temporary password. Please log in and change your password immediately after your first login for security reasons.

Login Portal: [Your platform URL]

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
Support Team
        `.trim();

        try {
          const emailSent = await this.mailService.sendMail(
            [newUser.email],
            emailSubject,
            emailBody
          );
          
          if (emailSent) {
            this.logger.log(`✅ Temporary password email sent successfully to ${newUser.email}`, 'UserService', newUser.id);
          } else {
            this.logger.error(`❌ Failed to send temporary password email to ${newUser.email}`, 'UserService', newUser.id);
          }
        } catch (error) {
          this.logger.error(`❌ Error sending temporary password email to ${newUser.email}: ${error.message}`, 'UserService', newUser.id);
        }
      }

      // Fetch complete user data for response
      const completeUserQuery = `
        SELECT 
          u.id, u.firstName, u.lastName, u.email, u.accountId, u.phoneNumber,
          u.isActive, u.isMfaEnabled, u.isLocked, u.isSuspended,
          u.createdAt, u.updatedAt, u.createdBy, u.parentId,
          r.id as roleId, r.name as roleName, r.description as roleDescription,
          p.id as parentUserId, p.firstName as parentFirstName, p.lastName as parentLastName
        FROM users u
        LEFT JOIN roles r ON u.roleId = r.id
        LEFT JOIN users p ON u.parentId = p.id
        WHERE u.id = $1
      `;
      
      const completeUserResult = await client.query(completeUserQuery, [newUser.id]);
      const completeUser = completeUserResult.rows[0];

      this.logger.log(`User created successfully with ID: ${newUser.id}`);
      
      return {
        id: completeUser.id,
        firstName: completeUser.firstname,
        lastName: completeUser.lastname,
        email: completeUser.email,
        accountId: completeUser.accountid,
        contactNumber: completeUser.phonenumber,
        isActive: completeUser.isactive,
        isMfaEnabled: completeUser.ismfaenabled,
        isLocked: completeUser.islocked,
        isSuspended: completeUser.issuspended,
        createdAt: completeUser.createdat,
        updatedAt: completeUser.updatedat,
        createdBy: completeUser.createdby,
        role: {
          id: completeUser.roleid,
          name: completeUser.rolename,
          description: completeUser.roledescription
        },
        parent: completeUser.parentuserid ? {
          id: completeUser.parentuserid,
          name: `${completeUser.parentfirstname} ${completeUser.parentlastname}`
        } : null
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw error;
    } finally {
      client.release();
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }



  async findAll(options?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    includeInactive?: boolean;
  }) {
    const { skip = 0, take = 10, where, orderBy, includeInactive = false } = options || {};
    
    try {
      // Build WHERE clause
      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Add isActive filter unless explicitly requested to include inactive users
      if (!includeInactive) {
        whereConditions.push(`u.is_active = true`);
      }

      // Add any additional where conditions
      if (where) {
        if (where.email) {
          whereConditions.push(`u.email ILIKE $${paramIndex}`);
          queryParams.push(`%${where.email}%`);
          paramIndex++;
        }
        if (where.name) {
          whereConditions.push(`(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`);
          queryParams.push(`%${where.name}%`);
          paramIndex++;
        }
        if (where.roleId) {
          whereConditions.push(`u.role_id = $${paramIndex}`);
          queryParams.push(where.roleId);
          paramIndex++;
        }
        if (where.tenantId) {
          whereConditions.push(`u.tenant_id = $${paramIndex}`);
          queryParams.push(where.tenantId);
          paramIndex++;
        }
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        ${whereClause}
      `;
      const countResult = await this.db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Build ORDER BY clause
      let orderByClause = 'ORDER BY u.created_at DESC';
      if (orderBy) {
        const orderFields = Object.entries(orderBy).map(([field, direction]) => {
          const dbField = this.mapFieldToDbColumn(field);
          return `${dbField} ${direction}`;
        }).join(', ');
        orderByClause = `ORDER BY ${orderFields}`;
      }

      // Fetch users with pagination
      const usersQuery = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, u.account_id, u.phone_number,
          u.is_active, u.is_mfa_enabled, u.is_locked, u.is_suspended,
          u.created_at, u.updated_at, u.created_by, u.parent_id, u.tenant_id,
          r.id as role_id, r.name as role_name, r.description as role_description,
          p.id as parent_user_id, p.first_name as parent_first_name, p.last_name as parent_last_name,
          t.id as tenant_id, t.name as tenant_name,
          s.id as site_id, s.name as site_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN users p ON u.parent_id = p.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN sites s ON u.site_id = s.id
        ${whereClause}
        ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(take, skip);
      const usersResult = await this.db.query(usersQuery, queryParams);

      // For each user, fetch their sites and credentials
      const usersWithRelations = await Promise.all(usersResult.rows.map(async (row) => {
        // Fetch user sites
        const sitesQuery = `
          SELECT s.id, s.name, s.address, s.image
          FROM user_sites us
          JOIN sites s ON us.site_id = s.id
          WHERE us.user_id = $1
        `;
        const sitesResult = await this.db.query(sitesQuery, [row.id]);

        // Fetch credentials count (not full details for list view)
        const credentialsQuery = `
          SELECT COUNT(*) as count
          FROM credentials
          WHERE user_id = $1
        `;
        const credentialsResult = await this.db.query(credentialsQuery, [row.id]);

        return {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          accountId: row.account_id,
          phoneNumber: row.phone_number,
          isActive: row.is_active,
          isMfaEnabled: row.is_mfa_enabled,
          isLocked: row.is_locked,
          isSuspended: row.is_suspended,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          createdBy: row.created_by,
          role: row.role_id ? {
            id: row.role_id,
            name: row.role_name,
            description: row.role_description,
            displayName: row.role_name
          } : null,
          parent: row.parent_user_id ? {
            id: row.parent_user_id,
            name: `${row.parent_first_name} ${row.parent_last_name}`
          } : null,
          tenant: row.tenant_id ? {
            id: row.tenant_id,
            name: row.tenant_name
          } : null,
          site: row.site_id ? {
            id: row.site_id,
            name: row.site_name
          } : null,
          sites: sitesResult.rows,
          credentialsCount: parseInt(credentialsResult.rows[0].count)
        };
      }));

      // Calculate pagination metadata
      const page = Math.floor(skip / take) + 1;
      const pages = Math.ceil(total / take);

      this.logger.log(
        `Retrieved ${usersWithRelations.length} users (page ${page} of ${pages})`,
        'UserService',
        null,
        { 
          filters: { skip, take, where, orderBy },
          pagination: { total, page, pages }
        }
      );

      // Return paginated response
      const paginatedResponse: PaginatedResponseDto<typeof usersWithRelations[0]> = {
        items: usersWithRelations,
        total,
        page,
        pages,
        limit: take,
        hasPreviousPage: page > 1,
        hasNextPage: page < pages
      };

      return paginatedResponse;
    } catch (error) {
      this.logger.error(
        `Failed to fetch users: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    }
  }

  async findOne(id: string, includeInactive: boolean = false) {
    try {
      const query = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, u.account_id, u.phone_number,
          u.is_active, u.is_mfa_enabled, u.is_locked, u.is_suspended,
          u.created_at, u.updated_at, u.created_by, u.parent_id, u.tenant_id,
          r.id as role_id, r.name as role_name, r.description as role_description,
          p.id as parent_user_id, p.first_name as parent_first_name, p.last_name as parent_last_name,
          t.id as tenant_id, t.name as tenant_name, t.description as tenant_description,
          s.id as site_id, s.name as site_name, s.address as site_address
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN users p ON u.parent_id = p.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN sites s ON u.site_id = s.id
        WHERE u.id = $1
      `;

      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        this.logger.warn(
          `User not found: ${id}`,
          'UserService'
        );
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const user = result.rows[0];

      // Check if user is inactive and we're not explicitly including inactive users
      if (!includeInactive && !user.is_active) {
        this.logger.warn(
          `User is inactive: ${id}`,
          'UserService'
        );
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Fetch user sites
      const sitesQuery = `
        SELECT s.id, s.name, s.address, s.image
        FROM user_sites us
        JOIN sites s ON us.site_id = s.id
        WHERE us.user_id = $1
      `;
      const sitesResult = await this.db.query(sitesQuery, [id]);

      // Fetch credentials
      const credentialsQuery = `
        SELECT id, name, credential_type, phone_number, email_address, 
               card_number, pin_number, created_at, updated_at
        FROM credentials
        WHERE user_id = $1
      `;
      const credentialsResult = await this.db.query(credentialsQuery, [id]);

      // Fetch MFA details
      const mfaQuery = `
        SELECT id, created_at, updated_at, is_setup_complete
        FROM mfa
        WHERE user_id = $1
      `;
      const mfaResult = await this.db.query(mfaQuery, [id]);

      // Fetch login details
      const loginDetailsQuery = `
        SELECT last_login, failed_attempts, last_failed_at
        FROM user_login_details
        WHERE user_id = $1
      `;
      const loginDetailsResult = await this.db.query(loginDetailsQuery, [id]);

      this.logger.log(
        `User retrieved: ${id}`,
        'UserService',
        id
      );

      // Transform user to match expected format
      const userResponse = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        accountId: user.account_id,
        phoneNumber: user.phone_number,
        isActive: user.is_active,
        isMfaEnabled: user.is_mfa_enabled,
        isLocked: user.is_locked,
        isSuspended: user.is_suspended,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        createdBy: user.created_by,
        role: user.role_id ? {
          id: user.role_id,
          name: user.role_name,
          description: user.role_description
        } : null,
        parent: user.parent_user_id ? {
          id: user.parent_user_id,
          name: `${user.parent_first_name} ${user.parent_last_name}`
        } : null,
        tenant: user.tenant_id ? {
          id: user.tenant_id,
          name: user.tenant_name,
          description: user.tenant_description
        } : null,
        site: user.site_id ? {
          id: user.site_id,
          name: user.site_name,
          address: user.site_address
        } : null,
        sites: sitesResult.rows,
        credentials: credentialsResult.rows,
        mfa: mfaResult.rows.length > 0 ? mfaResult.rows[0] : null,
        userLoginDetails: loginDetailsResult.rows.length > 0 ? loginDetailsResult.rows[0] : null
      };
      
      return userResponse;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Error fetching user ${id}: ${error.message}`,
          error.stack,
          'UserService'
        );
      }
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Check if user exists and is active
      await this.findOne(id);

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      // Add fields to update
      if (updateUserDto.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex}`);
        updateValues.push(updateUserDto.firstName);
        paramIndex++;
      }

      if (updateUserDto.lastName !== undefined) {
        updateFields.push(`last_name = $${paramIndex}`);
        updateValues.push(updateUserDto.lastName);
        paramIndex++;
      }

      if (updateUserDto.email !== undefined) {
        updateFields.push(`email = $${paramIndex}`);
        updateValues.push(updateUserDto.email);
        paramIndex++;
      }

      if (updateUserDto.contactNumber !== undefined) {
        updateFields.push(`phone_number = $${paramIndex}`);
        updateValues.push(updateUserDto.contactNumber);
        paramIndex++;
      }

      if (updateUserDto.userRole !== undefined) {
        // Validate role exists
        const roleQuery = `SELECT id FROM roles WHERE id = $1 AND is_active = true`;
        const roleResult = await client.query(roleQuery, [updateUserDto.userRole]);
        
        if (roleResult.rows.length === 0) {
          throw new BadRequestException(`Role with ID ${updateUserDto.userRole} not found or inactive`);
        }

        updateFields.push(`role_id = $${paramIndex}`);
        updateValues.push(updateUserDto.userRole);
        paramIndex++;
      }

      if (updateUserDto.parent !== undefined) {
        if (updateUserDto.parent) {
          // Validate parent exists and is admin
          const parentQuery = `
            SELECT u.id, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1 AND u.is_active = true
          `;
          const parentResult = await client.query(parentQuery, [updateUserDto.parent]);
          
          if (parentResult.rows.length === 0) {
            throw new BadRequestException(`Parent user with ID ${updateUserDto.parent} not found or inactive`);
          }
          
          // Check if parent is admin
          const parentRoleName = parentResult.rows[0].role_name?.toUpperCase() || '';
          if (!parentRoleName.includes('ADMIN')) {
            throw new ForbiddenException('Only administrators can be set as parent users');
          }
        }

        updateFields.push(`parent_id = $${paramIndex}`);
        updateValues.push(updateUserDto.parent);
        paramIndex++;
      }

      // Hash password if provided
      if (updateUserDto.password) {
        const hashedPassword = await this.hashPassword(updateUserDto.password);
        updateFields.push(`password = $${paramIndex}`);
        updateValues.push(hashedPassword);
        paramIndex++;
      }

      // Always update updated_at
      updateFields.push(`updated_at = NOW()`);

      // Execute update if there are fields to update
      if (updateFields.length > 0) {
        updateValues.push(id); // Add ID as last parameter
        const updateQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
        `;
        
        await client.query(updateQuery, updateValues);
      }

      // Handle site updates if provided
      if (updateUserDto.siteIds) {
        // Get current site relationships
        const currentSitesQuery = `SELECT site_id FROM user_sites WHERE user_id = $1`;
        const currentSitesResult = await client.query(currentSitesQuery, [id]);
        const currentSiteIds = currentSitesResult.rows.map(row => row.site_id);
        
        // Find site IDs to remove
        const siteIdsToRemove = currentSiteIds.filter(
          siteId => !updateUserDto.siteIds.includes(siteId)
        );
        
        // Find site IDs to add
        const siteIdsToAdd = updateUserDto.siteIds.filter(
          siteId => !currentSiteIds.includes(siteId)
        );

        // Remove old site relationships
        if (siteIdsToRemove.length > 0) {
          const deleteQuery = `
            DELETE FROM user_sites 
            WHERE user_id = $1 AND site_id = ANY($2)
          `;
          await client.query(deleteQuery, [id, siteIdsToRemove]);
        }

        // Add new site relationships
        for (const siteId of siteIdsToAdd) {
          const insertQuery = `
            INSERT INTO user_sites (id, user_id, site_id, assigned_at)
            VALUES (gen_random_uuid(), $1, $2, NOW())
          `;
          await client.query(insertQuery, [id, siteId]);
        }
      }

    //   // Handle credentials updates if provided
    //   if (updateUserDto.credentials && updateUserDto.credentials.length > 0) {
    //     // Delete existing credentials
    //     await client.query(`DELETE FROM credentials WHERE user_id = $1`, [id]);

    //     // Create new credentials
    //     for (const cred of updateUserDto.credentials) {
    //       const credInsertQuery = `
    //         INSERT INTO credentials (
    //           id, user_id, name, credential_type, phone_number, email_address,
    //           card_number, pin_number, created_at, updated_at
    //         ) VALUES (
    //           gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
    //         )
    //       `;
    //       await client.query(credInsertQuery, [
    //         id,
    //         cred.name,
    //         cred.credentialType,
    //         cred.phoneNumber || null,
    //         cred.emailAddress || null,
    //         cred.cardNumber || null,
    //         cred.pinNumber || null
    //       ]);
    //     }
    //   }

    //   await client.query('COMMIT');

      // Clear RBAC cache if role was updated
      if (updateUserDto.userRole) {
        await this.rbacService.clearUserPermissionCache(id);
      }

      // Fetch and return updated user
      const updatedUser = await this.findOne(id);

      this.logger.log(
        `User updated successfully: ${id}`,
        'UserService',
        id
      );

      return updatedUser;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(
        `Error updating user ${id}: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    } finally {
      client.release();
    }
  }

  private mapFieldToDbColumn(field: string): string {
    const fieldMap = {
      'firstName': 'u.first_name',
      'lastName': 'u.last_name',
      'email': 'u.email',
      'createdAt': 'u.created_at',
      'updatedAt': 'u.updated_at',
      'isActive': 'u.is_active',
      'role': 'r.name'
    };
    return fieldMap[field] || `u.${field}`;
  }
  


  async remove(id: string) {
    try {
      // Check if user exists (including inactive ones for this operation)
      const existingUser = await this.findOne(id, true);

      // Check if user is already inactive
      if (!existingUser.isActive) {
        throw new BadRequestException('User is already deleted');
      }

      // Soft delete by setting isActive to false
      const updateQuery = `
        UPDATE users 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING id, first_name, last_name, email, account_id
      `;
      
      const result = await this.db.query(updateQuery, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(
        `User soft deleted (deactivated): ${id}`,
        'UserService',
        id
      );

      // Fetch complete user data for response
      const deletedUser = await this.findOne(id, true);
      
      return {
        ...deletedUser,
        message: `User with ID ${id} has been deactivated successfully`
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete user ${id}: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    }
  }

  async reactivateUser(id: string) {
    try {
      // Check if user exists (including inactive ones for this operation)
      const existingUser = await this.findOne(id, true);

      // Check if user is already active
      if (existingUser.isActive) {
        throw new BadRequestException('User is already active');
      }

      // Reactivate by setting isActive to true
      const updateQuery = `
        UPDATE users 
        SET is_active = true, updated_at = NOW()
        WHERE id = $1
        RETURNING id, first_name, last_name, email, account_id
      `;
      
      const result = await this.db.query(updateQuery, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(
        `User reactivated: ${id}`,
        'UserService',
        id
      );

      // Fetch complete user data for response
      const reactivatedUser = await this.findOne(id, true);
      
      return {
        ...reactivatedUser,
        message: `User with ID ${id} has been reactivated successfully`
      };
    } catch (error) {
      this.logger.error(
        `Failed to reactivate user ${id}: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    }
  }

  async createBulk(bulkCreateUsersDto: BulkCreateUsersDto) {
    const { users, skipDuplicates = false } = bulkCreateUsersDto;
    
    // Prepare results tracking
    const results = {
      successful: [],
      failed: [],
      totalAttempted: users.length,
      totalSuccessful: 0,
      totalFailed: 0,
      summary: '',
      validationErrors: []
    };

    // Store transaction errors
    const emailErrors = {
      duplicatesWithinBatch: [],
      existingInDatabase: []
    };

    // Perform basic validation first
    if (!users || users.length === 0) {
      throw new BadRequestException('No users provided for bulk creation');
    }

    // Check for duplicate emails within the batch
    const emailsInBatch = users.map(user => user.email.toLowerCase());
    const duplicateEmails = emailsInBatch.filter(
      (email, index) => emailsInBatch.indexOf(email) !== index
    );

    // Store duplicate emails for reporting
    if (duplicateEmails.length > 0) {
      duplicateEmails.forEach(email => {
        if (!emailErrors.duplicatesWithinBatch.includes(email)) {
          emailErrors.duplicatesWithinBatch.push(email);
        }
      });

      // Fail immediately if skipDuplicates is false
      if (!skipDuplicates) {
        this.logger.warn(
          `Bulk user creation failed: Duplicate emails within batch: ${emailErrors.duplicatesWithinBatch.join(', ')}`,
          'UserService'
        );
        throw new BadRequestException(`Duplicate emails within batch: ${emailErrors.duplicatesWithinBatch.join(', ')}`);
      }
    }

    // Check for existing emails in the database (only active users)
    const existingEmailsQuery = `
      SELECT email 
      FROM users 
      WHERE LOWER(email) = ANY($1) AND is_active = true
    `;
    const existingEmailsResult = await this.db.query(existingEmailsQuery, [emailsInBatch]);
    const existingEmailList = existingEmailsResult.rows.map(row => row.email.toLowerCase());
    
    // Store existing emails for reporting
    if (existingEmailList.length > 0) {
      emailErrors.existingInDatabase = existingEmailList;

      // Fail immediately if skipDuplicates is false
      if (!skipDuplicates) {
        this.logger.warn(
          `Bulk user creation failed: Emails already exist in database: ${existingEmailList.join(', ')}`,
          'UserService'
        );
        throw new BadRequestException(`Emails already exist in database: ${existingEmailList.join(', ')}`);
      }
    }

    // Track processed emails to handle duplicates within batch when skipDuplicates is true
    const processedEmails = new Set();

    // Process each user
    for (const userData of users) {
      try {
        // Skip users with emails that already exist in DB if skipDuplicates is true
        if (existingEmailList.includes(userData.email.toLowerCase())) {
          results.failed.push({
            email: userData.email,
            error: 'Email already exists in database'
          });
          results.totalFailed++;
          continue;
        }

        // Skip duplicate emails within batch if skipDuplicates is true
        if (processedEmails.has(userData.email.toLowerCase())) {
          results.failed.push({
            email: userData.email,
            error: 'Duplicate email within batch'
          });
          results.totalFailed++;
          continue;
        }

        // Create the user
        const user = await this.create(userData);
        
        // Mark this email as processed
        processedEmails.add(userData.email.toLowerCase());
        
        // Add to successful list with minimal info
        results.successful.push({
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`
        });
        results.totalSuccessful++;
      } catch (error) {
        // Track failed creation
        results.failed.push({
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName}`,
          error: error.message
        });
        results.totalFailed++;
        
        // Log the error but continue processing
        this.logger.error(
          `Failed to create user during bulk operation: ${error.message}`,
          error.stack,
          'UserService',
          null,
          { email: userData.email }
        );
      }
    }

    // Add validation errors to results
    if (emailErrors.duplicatesWithinBatch.length > 0) {
      results.validationErrors.push({
        type: 'duplicateEmails',
        message: 'Duplicate emails found within batch',
        emails: emailErrors.duplicatesWithinBatch
      });
    }

    if (emailErrors.existingInDatabase.length > 0) {
      results.validationErrors.push({
        type: 'existingEmails',
        message: 'Emails already exist in database',
        emails: emailErrors.existingInDatabase
      });
    }

    // Create summary message
    results.summary = `Bulk user creation completed. Created ${results.totalSuccessful} of ${results.totalAttempted} users.`;
    
    this.logger.log(
      results.summary,
      'UserService',
      null,
      { 
        totalSuccessful: results.totalSuccessful, 
        totalFailed: results.totalFailed,
        failedEmails: results.failed.map(f => f.email),
        validationErrors: results.validationErrors
      }
    );

    return results;
  }

  async suspendUser(id: string, suspendUserDto: SuspendUserDto) {
    try {
      // Check if user exists and is active
      await this.findOne(id);

      // Note the reason in logs
      const reason = suspendUserDto.reason || 'No reason provided';
      this.logger.log(
        `Suspending user ${id}. Reason: ${reason}`,
        'UserService',
        id
      );

      // Update the user to be suspended
      const updateQuery = `
        UPDATE users 
        SET is_suspended = true, updated_at = NOW()
        WHERE id = $1
        RETURNING id, first_name, last_name, email, account_id
      `;
      
      const result = await this.db.query(updateQuery, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Fetch complete user data for response
      const suspendedUser = await this.findOne(id);
      
      return {
        ...suspendedUser,
        message: 'User has been suspended successfully'
      };
    } catch (error) {
      this.logger.error(
        `Error suspending user ${id}: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    }
  }
  async unsuspendUser(id: string) {
    try {
      // Check if user exists and is active
      await this.findOne(id);

      // Check if the user is actually suspended
      const checkQuery = `
        SELECT is_suspended 
        FROM users 
        WHERE id = $1
      `;
      const checkResult = await this.db.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (!checkResult.rows[0].is_suspended) {
        throw new BadRequestException('User is not currently suspended');
      }

      this.logger.log(
        `Unsuspending user ${id}`,
        'UserService',
        id
      );

      // Update the user to be unsuspended
      const updateQuery = `
        UPDATE users 
        SET is_suspended = false, updated_at = NOW()
        WHERE id = $1
        RETURNING id, first_name, last_name, email, account_id
      `;
      
      const result = await this.db.query(updateQuery, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Fetch complete user data for response
      const unsuspendedUser = await this.findOne(id);
      
      return {
        ...unsuspendedUser,
        message: 'User has been unsuspended successfully'
      };
    } catch (error) {
      this.logger.error(
        `Error unsuspending user ${id}: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    }
  }

  private async generateUniqueAccountId(): Promise<string> {
    let accountId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Generate a random 8-10 digit account ID
      const randomNum = Math.floor(Math.random() * 9999999999); // Up to 10 digits
      accountId = randomNum.toString().padStart(8, '0'); // Ensure minimum 8 digits
      
      // Check if this account ID already exists
      const checkQuery = `SELECT id FROM users WHERE account_id = $1 LIMIT 1`;
      const result = await this.db.query(checkQuery, [accountId]);

      if (result.rows.length === 0) {
        return accountId;
      }

      attempts++;
      this.logger.warn(`Account ID collision detected: ${accountId}. Attempt ${attempts}/${maxAttempts}`, 'UserService');
      
    } while (attempts < maxAttempts);

    // If we've reached max attempts, throw an error
    throw new BadRequestException('Unable to generate unique account ID after maximum attempts');
  }




  async findOneWithTenantCheck(id: string, requesterTenantId: string | null): Promise<any> {
    try {
      const query = `
        SELECT 
          u.id, u.tenant_id, u.is_active,
          u.first_name, u.last_name, u.email
        FROM users u
        WHERE u.id = $1
      `;
      
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      const user = result.rows[0];
      
      // Check if user is active
      if (!user.is_active) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      // Tenant isolation check
      if (requesterTenantId !== null && user.tenant_id !== requesterTenantId) {
        throw new ForbiddenException('Access denied: User not in your tenant');
      }
      
      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(
        `Error in findOneWithTenantCheck for user ${id}: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    }
  }

  async updateWithTenantCheck(id: string, updateUserDto: UpdateUserDto, requesterTenantId: string | null) {
    // First verify the user exists and requester has access
    await this.findOneWithTenantCheck(id, requesterTenantId);
    
    // Prevent tenant changes unless done by system admin
    if (updateUserDto.tenantId && requesterTenantId !== null) {
      throw new ForbiddenException('Cannot change user tenant - system admin access required');
    }
    
    // Use the existing update method
    const result = await this.update(id, updateUserDto);
    
    this.logger.log(
      `User updated with tenant check: ${id}`,
      'UserService',
      id,
      { requesterTenantId }
    );
    
    return result;
  }

  /**
   * Remove a user with tenant isolation check
   */
  async removeWithTenantCheck(id: string, requesterTenantId: string | null) {
    // First verify the user exists and requester has access
    await this.findOneWithTenantCheck(id, requesterTenantId);
    
    // Use the existing remove method
    const result = await this.remove(id);
    
    this.logger.log(
      `User deleted with tenant check: ${id}`,
      'UserService',
      id,
      { requesterTenantId }
    );
    
    return result;
  }

  /**
   * Reactivate a user with tenant isolation check
   */
  async reactivateUserWithTenantCheck(id: string, requesterTenantId: string | null) {
    // First verify the user exists and requester has access (including inactive users)
    const query = `
      SELECT tenant_id, is_active
      FROM users
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const user = result.rows[0];

    // Tenant isolation check
    if (requesterTenantId !== null && user.tenant_id !== requesterTenantId) {
      throw new ForbiddenException('Access denied: User not in your tenant');
    }
    
    // Use the existing reactivate method
    const reactivatedUser = await this.reactivateUser(id);
    
    this.logger.log(
      `User reactivated with tenant check: ${id}`,
      'UserService',
      id,
      { requesterTenantId }
    );
    
    return reactivatedUser;
  }

  /**
   * Suspend a user with tenant isolation check
   */
  async suspendUserWithTenantCheck(id: string, suspendUserDto: SuspendUserDto, requesterTenantId: string | null) {
    // First verify the user exists and requester has access
    await this.findOneWithTenantCheck(id, requesterTenantId);
    
    // Use the existing suspend method
    const result = await this.suspendUser(id, suspendUserDto);
    
    this.logger.log(
      `User suspended with tenant check: ${id}`,
      'UserService',
      id,
      { requesterTenantId, reason: suspendUserDto.reason }
    );
    
    return result;
  }

  /**
   * Unsuspend a user with tenant isolation check
   */
  async unsuspendUserWithTenantCheck(id: string, requesterTenantId: string | null) {
    // First verify the user exists and requester has access
    await this.findOneWithTenantCheck(id, requesterTenantId);
    
    // Use the existing unsuspend method
    const result = await this.unsuspendUser(id);
    
    this.logger.log(
      `User unsuspended with tenant check: ${id}`,
      'UserService',
      id,
      { requesterTenantId }
    );
    
    return result;
  }
  async migrateUserTenant(userId: string, targetTenantId: string) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Check if user exists
      const userQuery = `
        SELECT u.id, u.email, u.tenant_id, t.name as tenant_name
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        WHERE u.id = $1
      `;
      const userResult = await client.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const user = userResult.rows[0];
      const originalTenantId = user.tenant_id;

      // Check if target tenant exists
      const tenantQuery = `
        SELECT id, name, is_active 
        FROM tenants 
        WHERE id = $1
      `;
      const tenantResult = await client.query(tenantQuery, [targetTenantId]);

      if (tenantResult.rows.length === 0) {
        throw new NotFoundException(`Target tenant with ID ${targetTenantId} not found`);
      }

      const targetTenant = tenantResult.rows[0];

      if (!targetTenant.is_active) {
        throw new BadRequestException(`Target tenant ${targetTenant.name} is not active`);
      }

      // Update user's tenant
      const updateQuery = `
        UPDATE users 
        SET tenant_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, first_name, last_name, email, tenant_id
      `;
      await client.query(updateQuery, [targetTenantId, userId]);

      await client.query('COMMIT');

      this.logger.log(
        `User ${userId} migrated from tenant ${originalTenantId} to ${targetTenantId}`,
        'UserService',
        userId,
        { 
          originalTenant: originalTenantId,
          targetTenant: targetTenantId,
          targetTenantName: targetTenant.name
        }
      );

      // Fetch complete updated user
      const updatedUser = await this.findOne(userId);
      
      return {
        ...updatedUser,
        message: `User successfully migrated to ${targetTenant.name}`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(
        `Failed to migrate user ${userId} to tenant ${targetTenantId}: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Fix roles for all users to ensure proper Admin/User assignment
   * Simplified for 2-level hierarchy
   */
  async fixAllUsersRoles(): Promise<{
    processed: number;
    updated: number;
    errors: Array<{ userId: string; error: string }>;
    summary: Array<{ userId: string; name: string; email: string; oldRole: string; newRole: string }>;
  }> {
    const result = {
      processed: 0,
      updated: 0,
      errors: [],
      summary: []
    };

    try {
      // Get all users with their current roles
      const usersQuery = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.role_id,
               r.id as role_id, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.is_active = true
      `;
      const usersResult = await this.db.query(usersQuery);

      // Get available Admin and User roles
      const rolesQuery = `
        SELECT id, name 
        FROM roles 
        WHERE LOWER(name) IN ('admin', 'user') 
        AND is_active = true
      `;
      const rolesResult = await this.db.query(rolesQuery);
      
      const adminRole = rolesResult.rows.find(r => r.name.toLowerCase() === 'admin');
      const userRole = rolesResult.rows.find(r => r.name.toLowerCase() === 'user');

      if (!adminRole || !userRole) {
        throw new Error('Admin or User role not found in database');
      }

      for (const user of usersResult.rows) {
        result.processed++;
        
        try {
          const currentRoleName = user.role_name || 'none';
          let shouldBeAdmin = false;
          let newRoleId = null;
          let newRoleName = null;

          // Determine if user should be Admin based on role name patterns
          if (currentRoleName) {
            const upperRoleName = currentRoleName.toUpperCase();
            shouldBeAdmin = upperRoleName.includes('ADMIN') || 
                          upperRoleName.includes('SUPER') || 
                          upperRoleName.includes('MANAGER');
          }

          // Determine the correct role
          if (shouldBeAdmin && user.role_id !== adminRole.id) {
            newRoleId = adminRole.id;
            newRoleName = adminRole.name;
          } else if (!shouldBeAdmin && user.role_id !== userRole.id && user.role_id !== adminRole.id) {
            // Only update to User role if they don't already have Admin role
            newRoleId = userRole.id;
            newRoleName = userRole.name;
          }

          // Update if needed
          if (newRoleId) {
            const updateQuery = `
              UPDATE users 
              SET role_id = $1, updated_at = NOW()
              WHERE id = $2
            `;
            await this.db.query(updateQuery, [newRoleId, user.id]);

            result.updated++;
            result.summary.push({
              userId: user.id,
              name: `${user.first_name} ${user.last_name}`,
              email: user.email,
              oldRole: currentRoleName,
              newRole: newRoleName
            });

            this.logger.log(`Updated role for user ${user.email}: ${currentRoleName} → ${newRoleName}`);
          }
        } catch (error) {
          result.errors.push({
            userId: user.id,
            error: error.message
          });
          this.logger.error(`Failed to update role for user ${user.id}:`, error);
        }
      }

      this.logger.log(`Role fix completed: ${result.updated}/${result.processed} users updated`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fix roles:', error);
      throw error;
    }
  }

  /**
   * Validate that a user's role is properly set (Admin or User)
   * Simplified for 2-level hierarchy
   */
  async validateUserRole(userId: string): Promise<{
    isValid: boolean;
    currentRole: string | null;
    expectedRole: string | null;
    shouldUpdate: boolean;
  }> {
    try {
      const userQuery = `
        SELECT u.id, u.email, u.role_id,
               r.name as role_name,
               p.id as parent_id, pr.name as parent_role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN users p ON u.parent_id = p.id
        LEFT JOIN roles pr ON p.role_id = pr.id
        WHERE u.id = $1
      `;
      const userResult = await this.db.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      const user = userResult.rows[0];
      const currentRole = user.role_name;
      let expectedRole = 'User'; // Default to User

      // If user has a parent who is Admin, they might be Admin too
      // Or check based on current role name patterns
      if (currentRole) {
        const upperRoleName = currentRole.toUpperCase();
        if (upperRoleName.includes('ADMIN') || 
            upperRoleName.includes('SUPER') || 
            upperRoleName.includes('MANAGER')) {
          expectedRole = 'Admin';
        }
      }

      const isValid = currentRole && 
                     (currentRole.toLowerCase() === 'admin' || currentRole.toLowerCase() === 'user');
      
      const shouldUpdate = !isValid || 
                          (expectedRole.toLowerCase() !== currentRole.toLowerCase());

      // Update if needed
      if (shouldUpdate) {
        const roleQuery = `
          SELECT id FROM roles 
          WHERE LOWER(name) = $1 AND is_active = true
          LIMIT 1
        `;
        const roleResult = await this.db.query(roleQuery, [expectedRole.toLowerCase()]);
        
        if (roleResult.rows.length > 0) {
          const updateQuery = `
            UPDATE users 
            SET role_id = $1, updated_at = NOW()
            WHERE id = $2
          `;
          await this.db.query(updateQuery, [roleResult.rows[0].id, userId]);
          
          this.logger.log(`Updated user ${userId} role to ${expectedRole}`);
        }
      }

      return {
        isValid,
        currentRole,
        expectedRole,
        shouldUpdate
      };
    } catch (error) {
      this.logger.error(`Error validating user role: ${error.message}`, error.stack);
      throw error;
    }
  }




  async updateEndUserWithTenantCheck(
    id: string,
    updateUserDto: UpdateUserDto,
    requesterTenantId: string | null
  ) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Check if user exists and get their details
      const userQuery = `
        SELECT u.id, u.tenant_id, u.role_id, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
      `;
      const userResult = await client.query(userQuery, [id]);

      if (userResult.rows.length === 0) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      const user = userResult.rows[0];
      const roleName = user.role_name?.toUpperCase() || '';

      // Check if user is not an admin (simplified check)
      if (roleName.includes('ADMIN')) {
        throw new ForbiddenException('This endpoint is only for non-admin users');
      }

      // Tenant isolation check
      if (requesterTenantId !== null && user.tenant_id !== requesterTenantId) {
        throw new ForbiddenException('Access denied: User not in your tenant');
      }

      // Prevent role changes to admin through this endpoint
      if (updateUserDto.userRole) {
        const roleQuery = `SELECT name FROM roles WHERE id = $1`;
        const roleResult = await client.query(roleQuery, [updateUserDto.userRole]);
        
        if (roleResult.rows.length > 0) {
          const newRoleName = roleResult.rows[0].name?.toUpperCase() || '';
          if (newRoleName.includes('ADMIN')) {
            throw new ForbiddenException('Cannot change role to admin through this endpoint');
          }
        }
      }

      // Update user (excluding sensitive fields)
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updateUserDto.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex}`);
        updateValues.push(updateUserDto.firstName);
        paramIndex++;
      }

      if (updateUserDto.lastName !== undefined) {
        updateFields.push(`last_name = $${paramIndex}`);
        updateValues.push(updateUserDto.lastName);
        paramIndex++;
      }

      if (updateUserDto.email !== undefined) {
        updateFields.push(`email = $${paramIndex}`);
        updateValues.push(updateUserDto.email);
        paramIndex++;
      }

      if (updateUserDto.contactNumber !== undefined) {
        updateFields.push(`phone_number = $${paramIndex}`);
        updateValues.push(updateUserDto.contactNumber);
        paramIndex++;
      }

      // Always update updated_at
      updateFields.push(`updated_at = NOW()`);

      if (updateFields.length > 0) {
        updateValues.push(id);
        const updateQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
        `;
        await client.query(updateQuery, updateValues);
      }

      await client.query('COMMIT');

      // Return updated user
      return await this.findOne(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update an admin user with tenant isolation check
   * Simplified for 2-level hierarchy
   */
  async updateAdminWithTenantCheck(
    id: string,
    updateUserDto: UpdateUserDto,
    requesterTenantId: string | null
  ) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Check if user exists and is an admin
      const userQuery = `
        SELECT u.id, u.tenant_id, u.role_id, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
      `;
      const userResult = await client.query(userQuery, [id]);

      if (userResult.rows.length === 0) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      const user = userResult.rows[0];
      const roleName = user.role_name?.toUpperCase() || '';

      // Check if user is admin
      if (!roleName.includes('ADMIN')) {
        throw new ForbiddenException('This endpoint is only for admin users');
      }

      // Tenant isolation check
      if (requesterTenantId !== null && user.tenant_id !== requesterTenantId) {
        throw new ForbiddenException('Access denied: User not in your tenant');
      }

      // If role is being updated, ensure it remains an admin role
      if (updateUserDto.userRole) {
        const roleQuery = `SELECT name FROM roles WHERE id = $1`;
        const roleResult = await client.query(roleQuery, [updateUserDto.userRole]);
        
        if (roleResult.rows.length > 0) {
          const newRoleName = roleResult.rows[0].name?.toUpperCase() || '';
          if (!newRoleName.includes('ADMIN')) {
            throw new ForbiddenException('Cannot change admin role to non-admin role through this endpoint');
          }
        }
      }

      // Delegate to standard update method
      await client.query('COMMIT');
      return await this.update(id, updateUserDto);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all users with only id and name fields
   * Simplified for 2-level hierarchy
   */
  async findAllUsersBasic(requesterTenantId: string | null) {
    try {
      let query = `
        SELECT id, first_name, last_name
        FROM users
        WHERE is_active = true
      `;
      const queryParams = [];

      // Tenant isolation - system admins (requesterTenantId: null) can access any user
      if (requesterTenantId !== null) {
        query += ` AND tenant_id = $1`;
        queryParams.push(requesterTenantId);
      }

      query += ` ORDER BY first_name, last_name ASC`;

      const result = await this.db.query(query, queryParams);

      // Transform to include full name
      const users = result.rows.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`.trim()
      }));

      this.logger.log(
        `Retrieved ${users.length} users (basic info only)`,
        'UserService',
        null,
        { 
          requesterTenantId,
          userCount: users.length
        }
      );

      return users;
    } catch (error) {
      this.logger.error(
        `Failed to fetch users basic info: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    }
  }

  /**
   * Find admin users by tenant
   * Simplified for 2-level hierarchy - just finds users with Admin role
   */
  async findAdminUsersByTenant(tenantId: string, options?: {
    skip?: number;
    take?: number;
  }) {
    const skip = options?.skip || 0;
    const take = options?.take || 10;

    try {
      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.tenant_id = $1 
        AND u.is_active = true
        AND UPPER(r.name) LIKE '%ADMIN%'
      `;
      const countResult = await this.db.query(countQuery, [tenantId]);
      const total = parseInt(countResult.rows[0].total);

      // Users query
      const usersQuery = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, u.account_id,
          u.phone_number, u.is_active, u.created_at, u.updated_at,
          r.id as role_id, r.name as role_name, r.description as role_description,
          t.id as tenant_id, t.name as tenant_name,
          s.id as site_id, s.name as site_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN sites s ON u.site_id = s.id
        WHERE u.tenant_id = $1 
        AND u.is_active = true
        AND UPPER(r.name) LIKE '%ADMIN%'
        ORDER BY u.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const usersResult = await this.db.query(usersQuery, [tenantId, take, skip]);

      // Transform results
      const users = usersResult.rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        accountId: row.account_id,
        phoneNumber: row.phone_number,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tenant: row.tenant_id ? {
          id: row.tenant_id,
          name: row.tenant_name
        } : null,
        role: {
          id: row.role_id,
          name: row.role_name,
          description: row.role_description
        },
        site: row.site_id ? {
          id: row.site_id,
          name: row.site_name
        } : null
      }));

      return {
        users,
        total,
        skip,
        take
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch admin users for tenant ${tenantId}: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    }
  }

  /**
   * Find all users with advanced filters
   * Simplified to just filter by Admin role
   */
  async findAllUsersAdvanced(tenantId: string, options?: {
    skip?: number;
    take?: number;
    includeInactive?: boolean;
  }) {
    const skip = options?.skip || 0;
    const take = options?.take || 10;

    try {
      // Build WHERE conditions
      let whereConditions = [`u.tenant_id = $1`];
      const queryParams = [tenantId];

      if (!options?.includeInactive) {
        whereConditions.push(`u.is_active = true`);
      }

      // Only get admin users
      whereConditions.push(`UPPER(r.name) LIKE '%ADMIN%'`);

      const whereClause = whereConditions.join(' AND ');

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE ${whereClause}
      `;
      const countResult = await this.db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Users query
      queryParams.push(take.toString(), skip.toString());
      const usersQuery = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, u.account_id,
          u.phone_number, u.is_active, u.created_at, u.updated_at,
          r.id as role_id, r.name as role_name, r.description as role_description,
          t.id as tenant_id, t.name as tenant_name,
          s.id as site_id, s.name as site_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN sites s ON u.site_id = s.id
        WHERE ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `;
      const usersResult = await this.db.query(usersQuery, queryParams);

      // Transform results (same as findAdminUsersByTenant)
      const users = usersResult.rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        accountId: row.account_id,
        phoneNumber: row.phone_number,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tenant: row.tenant_id ? {
          id: row.tenant_id,
          name: row.tenant_name
        } : null,
        role: {
          id: row.role_id,
          name: row.role_name,
          description: row.role_description
        },
        site: row.site_id ? {
          id: row.site_id,
          name: row.site_name
        } : null
      }));

      return {
        users,
        total,
        skip,
        take
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch users with advanced filters: ${error.message}`,
        error.stack,
        'UserService'
      );
      throw error;
    }
  }

  /**
   * Fix user role based on current patterns
   * Simplified for 2-level hierarchy
   */
  async fixUserRole(userId: string): Promise<{
    updated: boolean;
    oldRole: string | null;
    newRole: string | null;
  }> {
    try {
      // Get user's current role
      const userQuery = `
        SELECT u.id, u.role_id, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
      `;
      const userResult = await this.db.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      const user = userResult.rows[0];
      const oldRole = user.role_name;
      
      // This method validates and updates the role if needed
      const validation = await this.validateUserRole(userId);

      return {
        updated: validation.shouldUpdate,
        oldRole,
        newRole: validation.expectedRole
      };
    } catch (error) {
      this.logger.error(`Error fixing user role: ${error.message}`, error.stack);
      throw error;
    }
  }
}



