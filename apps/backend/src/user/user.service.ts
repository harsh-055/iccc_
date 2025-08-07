import { BadRequestException, Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, PaginatedResponseDto, SuspendUserDto } from './dto/index';
import { LoggerService } from '../logger/logger.service';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../../database/database.service';
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
    @Inject(forwardRef(() => RbacService))
    private rbacService: RbacService,
    private mailService: LensMailService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Hash the password
      const hashedPassword = await this.hashPassword(createUserDto.password);

      // Validate mutually exclusive role fields
      const hasSystemRole = !!(createUserDto.userRole || createUserDto.userRoleId);
      const hasCustomRole = !!(createUserDto.roleName || createUserDto.roleNameId || createUserDto.roleNames || createUserDto.roleNameIds);
      
      if (hasSystemRole && hasCustomRole) {
        throw new BadRequestException('Cannot specify both system role (userRole/userRoleId) and custom roles (roleName/roleNameId/roleNames/roleNameIds). Choose one approach.');
      }

      // For multi-tenant architecture, require either system role or custom role assignment
      if (!hasSystemRole && !hasCustomRole) {
        throw new BadRequestException('Must specify either a system role (userRole/userRoleId) or custom roles (roleName/roleNameId/roleNames/roleNameIds) for proper multi-tenant user management.');
      }
      
      // Validate that tenant is provided (required for multi-tenant)
      if (!createUserDto.tenantName && !createUserDto.tenantId) {
        throw new BadRequestException('Tenant assignment is required for multi-tenant user management. Please specify either tenantName or tenantId.');
      }

      // Validate mutually exclusive approaches for each field
      if (createUserDto.userRole && createUserDto.userRoleId) {
        throw new BadRequestException('Cannot specify both userRole and userRoleId. Choose one approach.');
      }
      if (createUserDto.roleName && createUserDto.roleNameId) {
        throw new BadRequestException('Cannot specify both roleName and roleNameId. Choose one approach.');
      }
      if (createUserDto.roleNames && createUserDto.roleNameIds) {
        throw new BadRequestException('Cannot specify both roleNames and roleNameIds. Choose one approach.');
      }
      if (createUserDto.parent && createUserDto.parentId) {
        throw new BadRequestException('Cannot specify both parent (legacy) and parentId. Use parentId (primary method) only.');
      }
      
      // Warn about legacy parent name usage
      if (createUserDto.parent && !createUserDto.parentId) {
        this.logger.warn(`Legacy parent name usage detected: ${createUserDto.parent}. Consider using parentId for better performance and reliability.`);
      }
      if (createUserDto.tenantName && createUserDto.tenantId) {
        throw new BadRequestException('Cannot specify both tenantName and tenantId. Choose one approach.');
      }

      // Validate and get tenant ID
      let tenantId: string | null = null;
      if (createUserDto.tenantName) {
        const tenantQuery = `
          SELECT id, name 
          FROM tenants 
          WHERE LOWER(name) = LOWER($1) AND is_active = true
        `;
        const tenantResult = await client.query(tenantQuery, [createUserDto.tenantName]);
        
        if (tenantResult.rows.length === 0) {
          throw new BadRequestException(`Tenant with name '${createUserDto.tenantName}' not found or inactive`);
        }
        
        tenantId = tenantResult.rows[0].id;
      } else if (createUserDto.tenantId) {
        const tenantQuery = `
          SELECT id, name 
          FROM tenants 
          WHERE id = $1 AND is_active = true
        `;
        const tenantResult = await client.query(tenantQuery, [createUserDto.tenantId]);
        
        if (tenantResult.rows.length === 0) {
          throw new BadRequestException(`Tenant with ID '${createUserDto.tenantId}' not found or inactive`);
        }
        
        tenantId = tenantResult.rows[0].id;
      }
      
      // For multi-tenant architecture, require tenant assignment
      if (!tenantId) {
        throw new BadRequestException('Tenant assignment is required for multi-tenant user management. Please specify either tenantName or tenantId.');
      }

      // Validate and get parent user ID - Prioritize Parent ID over Parent Name
      let parentId: string | null = null;
      
      if (createUserDto.parentId) {
        // Primary method: Parent ID (recommended)
        const parentQuery = `
          SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) as username, ur.role_id, r.name as role_name
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE u.id = $1 AND u.is_active = true
        `;
        const parentResult = await client.query(parentQuery, [createUserDto.parentId]);
        
        if (parentResult.rows.length === 0) {
          throw new BadRequestException(`Parent user with ID '${createUserDto.parentId}' not found or inactive`);
        }
        
        // Check if parent has admin permissions
        const hasAdminRole = parentResult.rows.some(row => 
          row.role_name && row.role_name.toLowerCase().includes('admin')
        );
        
        if (!hasAdminRole) {
          throw new ForbiddenException('Parent user must have administrative privileges to create new users');
        }
        
        parentId = parentResult.rows[0].id;
        this.logger.log(`Parent assigned via ID: ${parentId} (${parentResult.rows[0].username})`);
        
      } else if (createUserDto.parent) {
        // Legacy method: Parent Name (not recommended)
        this.logger.log(`Looking for parent user with name: '${createUserDto.parent}'`);
        
        const parentQuery = `
          SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) as username, ur.role_id, r.name as role_name
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE LOWER(CONCAT(u.first_name, ' ', u.last_name)) = LOWER($1) AND u.is_active = true
        `;
        const parentResult = await client.query(parentQuery, [createUserDto.parent]);
        
        if (parentResult.rows.length === 0) {
          // Make parent optional - don't fail if parent not found
          this.logger.warn(`Parent user with name '${createUserDto.parent}' not found. Creating user without parent assignment.`);
          parentId = null;
        } else {
          // Check if parent has admin permissions
          const hasAdminRole = parentResult.rows.some(row => 
            row.role_name && row.role_name.toLowerCase().includes('admin')
          );
          
          if (!hasAdminRole) {
            this.logger.warn(`Parent user '${createUserDto.parent}' does not have admin privileges. Creating user without parent assignment.`);
            parentId = null;
          } else {
            parentId = parentResult.rows[0].id;
            this.logger.warn(`Parent assigned via legacy username method: ${createUserDto.parent} -> ${parentId}. Consider using parentId for better performance.`);
          }
        }
      }
      // If no parent is specified, parentId will remain null (optional)

      // Check if email already exists
      const existingUserQuery = `
        SELECT id, email, is_active 
        FROM users 
        WHERE LOWER(email) = LOWER($1)
      `;
      const existingUserResult = await client.query(existingUserQuery, [createUserDto.email]);
      
      const activeUser = existingUserResult.rows.find(user => user.is_active === true);
      if (activeUser) {
        throw new BadRequestException(`A user with email '${createUserDto.email}' already exists`);
      }

      // Create the user
      const insertUserQuery = `
        INSERT INTO users (
          id, first_name, last_name, email, phone_number, password,
          is_active, is_mfa_enabled, is_suspended, tenant_id, parent_id, system_role_id,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, true, $6, $7, $8, $9, $10,
          NOW(), NOW()
        ) RETURNING id, email, first_name, last_name
      `;

      const userValues = [
        createUserDto.firstName,
        createUserDto.lastName,
        createUserDto.email,
        createUserDto.phoneNumber,
        hashedPassword,
        createUserDto.isMfaEnabled || false,
        false,
        tenantId || null,
        parentId,
        null // system_role_id will be set after role assignment
      ];

      const userResult = await client.query(insertUserQuery, userValues);
      const newUser = userResult.rows[0];

      // Handle role assignment
      if (hasSystemRole) {
        let systemRoleId: string;
        
        if (createUserDto.userRole) {
          // System role assignment by name
          const systemRoleQuery = `
            SELECT id, name
            FROM roles 
            WHERE LOWER(name) = LOWER($1) AND is_system = true AND is_active = true
          `;
          const systemRoleResult = await client.query(systemRoleQuery, [createUserDto.userRole]);
          
          if (systemRoleResult.rows.length === 0) {
            throw new BadRequestException(`System role '${createUserDto.userRole}' not found or inactive`);
          }
          
          systemRoleId = systemRoleResult.rows[0].id;
        } else if (createUserDto.userRoleId) {
          // System role assignment by ID
          const systemRoleQuery = `
            SELECT id, name
            FROM roles 
            WHERE id = $1 AND is_system = true AND is_active = true
          `;
          const systemRoleResult = await client.query(systemRoleQuery, [createUserDto.userRoleId]);
          
          if (systemRoleResult.rows.length === 0) {
            throw new BadRequestException(`System role with ID '${createUserDto.userRoleId}' not found or inactive`);
          }
          
          systemRoleId = systemRoleResult.rows[0].id;
        } else {
          throw new BadRequestException('Must specify either userRole or userRoleId for system role assignment');
        }
        
        // Update user with system_role_id
        await client.query(
          `UPDATE users SET system_role_id = $1 WHERE id = $2`,
          [systemRoleId, newUser.id]
        );
        
        // Assign system role to user
        await client.query(
          `INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by, assigned_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [newUser.id, systemRoleId, tenantId, parentId]
        );
      } else {
        // Custom role assignment
        let roleIds: string[] = [];
        
        if (createUserDto.roleName) {
          // Single custom role by name
          const customRoleQuery = `
            SELECT id, name, tenant_id
            FROM roles 
            WHERE LOWER(name) = LOWER($1) AND is_system = false AND is_active = true
            ${tenantId ? 'AND (tenant_id = $2 OR tenant_id IS NULL)' : 'AND tenant_id IS NULL'}
          `;
          
          const customRoleParams = tenantId ? [createUserDto.roleName, tenantId] : [createUserDto.roleName];
          const customRoleResult = await client.query(customRoleQuery, customRoleParams);
          
          if (customRoleResult.rows.length === 0) {
            throw new BadRequestException(`Custom role '${createUserDto.roleName}' not found or not accessible for this tenant`);
          }
          
          roleIds = [customRoleResult.rows[0].id];
        } else if (createUserDto.roleNameId) {
          // Single custom role by ID
          const customRoleQuery = `
            SELECT id, name, tenant_id
            FROM roles 
            WHERE id = $1 AND is_system = false AND is_active = true
            ${tenantId ? 'AND (tenant_id = $2 OR tenant_id IS NULL)' : 'AND tenant_id IS NULL'}
          `;
          
          const customRoleParams = tenantId ? [createUserDto.roleNameId, tenantId] : [createUserDto.roleNameId];
          const customRoleResult = await client.query(customRoleQuery, customRoleParams);
          
          if (customRoleResult.rows.length === 0) {
            throw new BadRequestException(`Custom role with ID '${createUserDto.roleNameId}' not found or not accessible for this tenant`);
          }
          
          roleIds = [customRoleResult.rows[0].id];
        } else if (createUserDto.roleNames) {
          // Multiple custom roles by names
          for (const roleName of createUserDto.roleNames) {
            if (!roleName) continue;
            
            const customRoleQuery = `
              SELECT id, name, tenant_id
              FROM roles 
              WHERE LOWER(name) = LOWER($1) AND is_system = false AND is_active = true
              ${tenantId ? 'AND (tenant_id = $2 OR tenant_id IS NULL)' : 'AND tenant_id IS NULL'}
            `;
            
            const customRoleParams = tenantId ? [roleName, tenantId] : [roleName];
            const customRoleResult = await client.query(customRoleQuery, customRoleParams);
            
            if (customRoleResult.rows.length === 0) {
              throw new BadRequestException(`Custom role '${roleName}' not found or not accessible for this tenant`);
            }
            
            roleIds.push(customRoleResult.rows[0].id);
          }
        } else if (createUserDto.roleNameIds) {
          // Multiple custom roles by IDs
          for (const roleId of createUserDto.roleNameIds) {
            if (!roleId) continue;
            
            const customRoleQuery = `
              SELECT id, name, tenant_id
              FROM roles 
              WHERE id = $1 AND is_system = false AND is_active = true
              ${tenantId ? 'AND (tenant_id = $2 OR tenant_id IS NULL)' : 'AND tenant_id IS NULL'}
            `;
            
            const customRoleParams = tenantId ? [roleId, tenantId] : [roleId];
            const customRoleResult = await client.query(customRoleQuery, customRoleParams);
            
            if (customRoleResult.rows.length === 0) {
              throw new BadRequestException(`Custom role with ID '${roleId}' not found or not accessible for this tenant`);
            }
            
            roleIds.push(customRoleResult.rows[0].id);
          }
        } else {
          throw new BadRequestException('Must specify custom roles using roleName, roleNameId, roleNames, or roleNameIds');
        }
        
        // Assign custom roles to user
        for (const roleId of roleIds) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by, assigned_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [newUser.id, roleId, tenantId, parentId]
          );
        }
      }

      // Handle direct permission assignment (if provided)
      if (createUserDto.permissionNames && createUserDto.permissionNames.length > 0) {
        for (const permissionName of createUserDto.permissionNames) {
          const permissionQuery = `
            SELECT id, name 
            FROM permissions 
            WHERE LOWER(name) = LOWER($1) AND is_active = true
          `;
          const permissionResult = await client.query(permissionQuery, [permissionName]);
          
          if (permissionResult.rows.length === 0) {
            this.logger.warn(`Permission '${permissionName}' not found, skipping assignment`);
            continue;
          }
          
          // Assign permission directly to user
          await client.query(
            `INSERT INTO user_permissions (user_id, permission_id, assigned_by, assigned_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, permission_id) DO NOTHING`,
            [newUser.id, permissionResult.rows[0].id, parentId]
          );
        }
      }

      // Handle direct permission assignment by IDs (if provided)
      if (createUserDto.permissionIds && createUserDto.permissionIds.length > 0) {
        for (const permissionId of createUserDto.permissionIds) {
          const permissionQuery = `
            SELECT id, name 
            FROM permissions 
            WHERE id = $1 AND is_active = true
          `;
          const permissionResult = await client.query(permissionQuery, [permissionId]);
          
          if (permissionResult.rows.length === 0) {
            this.logger.warn(`Permission with ID '${permissionId}' not found, skipping assignment`);
            continue;
          }
          
          // Assign permission directly to user
          await client.query(
            `INSERT INTO user_permissions (user_id, permission_id, assigned_by, assigned_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, permission_id) DO NOTHING`,
            [newUser.id, permissionResult.rows[0].id, parentId]
          );
        }
      }

      // Create user login details
      await client.query(
        `INSERT INTO user_login_details (user_id, whitelisted_ip, failed_attempts, last_login)
         VALUES ($1, $2::text[], $3, NOW())`,
        [newUser.id, [], 0]
      );

      await client.query('COMMIT');

      // Clear RBAC cache for the new user
      await this.rbacService.clearUserPermissionCache(newUser.id);

      // Fetch complete user data for response
      const completeUserQuery = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, CONCAT(u.first_name, ' ', u.last_name) as username, u.phone_number,
          u.is_active, u.is_mfa_enabled, u.is_suspended,
          u.created_at, u.updated_at, u.tenant_id, u.parent_id,
          t.name as tenant_name,
          p.first_name as parent_first_name, p.last_name as parent_last_name, CONCAT(p.first_name, ' ', p.last_name) as parent_username
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN users p ON u.parent_id = p.id
        WHERE u.id = $1
      `;
      
      const completeUserResult = await client.query(completeUserQuery, [newUser.id]);
      const completeUser = completeUserResult.rows[0];

      this.logger.log(`User created successfully with ID: ${newUser.id} and email: ${newUser.email}`);
      
      return {
        id: completeUser.id,
        firstName: completeUser.first_name,
        lastName: completeUser.last_name,
        email: completeUser.email,
        username: completeUser.username,
        phoneNumber: completeUser.phone_number,
        isActive: completeUser.is_active,
        isMfaEnabled: completeUser.is_mfa_enabled,

        isSuspended: completeUser.is_suspended,
        createdAt: completeUser.created_at,
        updatedAt: completeUser.updated_at,
        tenant: completeUser.tenant_name ? {
          id: completeUser.tenant_id,
          name: completeUser.tenant_name
        } : null,
        parent: completeUser.parent_id ? {
          id: completeUser.parent_id,
          name: `${completeUser.parent_first_name} ${completeUser.parent_last_name}`,
          username: completeUser.parent_username
        } : null
      };
      
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        this.logger.error(`Error during rollback: ${rollbackError.message}`, rollbackError.stack);
      }
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw error;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        this.logger.error(`Error releasing client: ${releaseError.message}`, releaseError.stack);
      }
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
          whereConditions.push(`EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = u.id 
            AND ur.role_id = $${paramIndex}
          )`);
          queryParams.push(where.roleId);
          paramIndex++;
        }
        
        if (where.roleIds && where.roleIds.length > 0) {
          const roleIdPlaceholders = where.roleIds.map((_, index) => `$${paramIndex + index}`).join(',');
          whereConditions.push(`EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = u.id 
            AND ur.role_id IN (${roleIdPlaceholders})
          )`);
          queryParams.push(...where.roleIds);
          paramIndex += where.roleIds.length;
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
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        ${whereClause}
      `;
      const countResult = await this.db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Build ORDER BY clause
      let orderByClause = 'ORDER BY u.created_at DESC';
      if (orderBy) {
        const orderFields = [];
        for (const [field, direction] of Object.entries(orderBy)) {
          const dir = direction === 'desc' ? 'DESC' : 'ASC';
          switch (field) {
            case 'email':
              orderFields.push(`u.email ${dir}`);
              break;
            case 'firstName':
              orderFields.push(`u.first_name ${dir}`);
              break;
            case 'lastName':
              orderFields.push(`u.last_name ${dir}`);
              break;
            case 'createdAt':
              orderFields.push(`u.created_at ${dir}`);
              break;
            default:
              // Ignore unknown fields to prevent SQL injection
              break;
          }
        }
        if (orderFields.length > 0) {
          orderByClause = `ORDER BY ${orderFields.join(', ')}`;
        }
      }

      // Main query with pagination
      const query = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, CONCAT(u.first_name, ' ', u.last_name) as username, u.phone_number,
          u.is_active, u.is_mfa_enabled, u.is_suspended,
          u.created_at, u.updated_at, u.tenant_id, u.parent_id,
          t.name as tenant_name,
          p.first_name as parent_first_name, p.last_name as parent_last_name, CONCAT(p.first_name, ' ', p.last_name) as parent_username
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN users p ON u.parent_id = p.id
        ${whereClause}
        ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(take, skip);
      const result = await this.db.query(query, queryParams);

      const users = result.rows.map(user => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        username: user.username,
        phoneNumber: user.phone_number,
        isActive: user.is_active,
        isMfaEnabled: user.is_mfa_enabled,
        isSuspended: user.is_suspended,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        tenant: user.tenant_name ? {
          id: user.tenant_id,
          name: user.tenant_name
          } : null,
        parent: user.parent_id ? {
          id: user.parent_id,
          name: `${user.parent_first_name} ${user.parent_last_name}`,
          username: user.parent_username
        } : null
      }));

      return {
        data: users,
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        totalPages: Math.ceil(total / take)
      };

    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const query = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, CONCAT(u.first_name, ' ', u.last_name) as username, u.phone_number,
          u.is_active, u.is_mfa_enabled, u.is_suspended,
          u.created_at, u.updated_at, u.tenant_id, u.parent_id,
          t.name as tenant_name,
          p.first_name as parent_first_name, p.last_name as parent_last_name, CONCAT(p.first_name, ' ', p.last_name) as parent_username
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN users p ON u.parent_id = p.id
        WHERE u.id = $1 AND u.is_active = true
      `;

      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const user = result.rows[0];

      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        username: user.username,
        phoneNumber: user.phone_number,
        isActive: user.is_active,
        isMfaEnabled: user.is_mfa_enabled,
        isSuspended: user.is_suspended,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        tenant: user.tenant_name ? {
          id: user.tenant_id,
          name: user.tenant_name
        } : null,
        parent: user.parent_id ? {
          id: user.parent_id,
          name: `${user.parent_first_name} ${user.parent_last_name}`,
          username: user.parent_username
        } : null
      };
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Check if user exists
      const existingUser = await this.findOne(id);

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (updateUserDto.firstName !== undefined) {
        updates.push(`first_name = $${paramIndex}`);
        values.push(updateUserDto.firstName);
        paramIndex++;
      }

      if (updateUserDto.lastName !== undefined) {
        updates.push(`last_name = $${paramIndex}`);
        values.push(updateUserDto.lastName);
        paramIndex++;
      }

      if (updateUserDto.email !== undefined) {
        // Check if email is already taken by another user
        const emailCheckQuery = `
          SELECT id FROM users 
          WHERE LOWER(email) = LOWER($1) AND id != $2 AND is_active = true
        `;
        const emailCheck = await client.query(emailCheckQuery, [updateUserDto.email, id]);
        
        if (emailCheck.rows.length > 0) {
          throw new BadRequestException(`Email ${updateUserDto.email} is already taken`);
        }
        
        updates.push(`email = $${paramIndex}`);
        values.push(updateUserDto.email);
        paramIndex++;
      }

      if (updateUserDto.phoneNumber !== undefined) {
        updates.push(`phone_number = $${paramIndex}`);
        values.push(updateUserDto.phoneNumber);
        paramIndex++;
      }

      if (updateUserDto.isMfaEnabled !== undefined) {
        updates.push(`is_mfa_enabled = $${paramIndex}`);
        values.push(updateUserDto.isMfaEnabled);
        paramIndex++;
      }

      // Handle parent update
      if (updateUserDto.parent !== undefined || updateUserDto.parentId !== undefined) {
        // Validate mutually exclusive approaches
        if (updateUserDto.parent && updateUserDto.parentId) {
          throw new BadRequestException('Cannot specify both parent and parentId. Choose one approach.');
        }

        let newParentId: string | null = null;

        if (updateUserDto.parent) {
          // Lookup parent by username
          const parentQuery = `
            SELECT u.id, u.username, ur.role_id, r.name as role_name
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE LOWER(u.username) = LOWER($1) AND u.is_active = true
          `;
          const parentResult = await client.query(parentQuery, [updateUserDto.parent]);
          
          if (parentResult.rows.length === 0) {
            throw new BadRequestException(`Parent user with username '${updateUserDto.parent}' not found or inactive`);
          }
          
          // Check if parent has admin permissions
          const hasAdminRole = parentResult.rows.some(row => 
            row.role_name && row.role_name.toLowerCase().includes('admin')
          );
          
          if (!hasAdminRole) {
            throw new ForbiddenException('Parent user must have administrative privileges');
          }
          
          newParentId = parentResult.rows[0].id;
        } else if (updateUserDto.parentId) {
          // Lookup parent by ID
          const parentQuery = `
            SELECT u.id, u.username, ur.role_id, r.name as role_name
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.id = $1 AND u.is_active = true
          `;
          const parentResult = await client.query(parentQuery, [updateUserDto.parentId]);
          
          if (parentResult.rows.length === 0) {
            throw new BadRequestException(`Parent user with ID '${updateUserDto.parentId}' not found or inactive`);
          }
          
          // Check if parent has admin permissions
          const hasAdminRole = parentResult.rows.some(row => 
            row.role_name && row.role_name.toLowerCase().includes('admin')
          );
          
          if (!hasAdminRole) {
            throw new ForbiddenException('Parent user must have administrative privileges');
          }
          
          newParentId = parentResult.rows[0].id;
        }

        updates.push(`parent_id = $${paramIndex}`);
        values.push(newParentId);
        paramIndex++;
      }



      if (updates.length === 0) {
        throw new BadRequestException('No valid fields to update');
      }
      
      // Add updated timestamp
      updates.push(`updated_at = NOW()`);
      values.push(id);
      
        const updateQuery = `
          UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING id
      `;
      
      const result = await client.query(updateQuery, values);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      await client.query('COMMIT');
      
      // Clear RBAC cache
        await this.rbacService.clearUserPermissionCache(id);
      
      // Return updated user
      return await this.findOne(id);
      
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        this.logger.error(`Error during rollback: ${rollbackError.message}`, rollbackError.stack);
      }
      this.logger.error(`Error updating user: ${error.message}`, error.stack);
      throw error;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        this.logger.error(`Error releasing client: ${releaseError.message}`, releaseError.stack);
      }
    }
  }

  async remove(id: string) {
    try {
      // Soft delete by setting is_active to false
      const query = `
        UPDATE users 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1 AND is_active = true
        RETURNING id, email
      `;
      
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Clear RBAC cache
      await this.rbacService.clearUserPermissionCache(id);
      
      this.logger.log(`User ${result.rows[0].email} deactivated successfully`);
      
      return { message: 'User deactivated successfully' };
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deactivating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async reactivateUser(id: string) {
    try {
      const query = `
        UPDATE users 
        SET is_active = true, updated_at = NOW()
        WHERE id = $1 AND is_active = false
        RETURNING id, email
      `;
      
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`Inactive user with ID ${id} not found`);
      }
      
      // Clear RBAC cache
      await this.rbacService.clearUserPermissionCache(id);
      
      this.logger.log(`User ${result.rows[0].email} reactivated successfully`);
      
      return await this.findOne(id);
      
    } catch (error) {
      if (error instanceof NotFoundException) {
      throw error;
    }
      this.logger.error(`Error reactivating user: ${error.message}`, error.stack);
      throw error;
    }
  }



  async suspendUser(id: string, suspendUserDto: SuspendUserDto) {
    try {
      // Check if user exists and is active
      await this.findOne(id);

      const query = `
        UPDATE users 
        SET is_suspended = true, suspension_reason = $1, updated_at = NOW()
        WHERE id = $2 AND is_active = true
        RETURNING id, email
      `;
      
      const result = await this.db.query(query, [suspendUserDto.reason, id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Clear RBAC cache
      await this.rbacService.clearUserPermissionCache(id);
      
      this.logger.log(`User ${result.rows[0].email} suspended successfully`);
      
      return await this.findOne(id);
      
    } catch (error) {
      if (error instanceof NotFoundException) {
      throw error;
    }
      this.logger.error(`Error suspending user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async unsuspendUser(id: string) {
    try {
      const query = `
        UPDATE users 
        SET is_suspended = false, suspension_reason = NULL, updated_at = NOW()
        WHERE id = $1 AND is_active = true
        RETURNING id, email
      `;
      
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      // Clear RBAC cache
      await this.rbacService.clearUserPermissionCache(id);
      
      this.logger.log(`User ${result.rows[0].email} unsuspended successfully`);
      
      return await this.findOne(id);
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error unsuspending user: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper method to get user by email
  async findByEmail(email: string) {
    try {
      const query = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, CONCAT(u.first_name, ' ', u.last_name) as username, u.phone_number,
          u.is_active, u.is_mfa_enabled, u.is_suspended,
          u.created_at, u.updated_at, u.tenant_id, u.parent_id,
          t.name as tenant_name,
          p.first_name as parent_first_name, p.last_name as parent_last_name, CONCAT(p.first_name, ' ', p.last_name) as parent_username
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN users p ON u.parent_id = p.id
        WHERE LOWER(u.email) = LOWER($1) AND u.is_active = true
      `;
      
      const result = await this.db.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];

      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        username: user.username,
        phoneNumber: user.phone_number,
        isActive: user.is_active,
        isMfaEnabled: user.is_mfa_enabled,
        isSuspended: user.is_suspended,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        tenant: user.tenant_name ? {
          id: user.tenant_id,
          name: user.tenant_name
        } : null,
        parent: user.parent_id ? {
          id: user.parent_id,
          name: `${user.parent_first_name} ${user.parent_last_name}`,
          username: user.parent_username
        } : null
      };
      
    } catch (error) {
      this.logger.error(`Error finding user by email: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper method to get user by username
  async findByUsername(username: string) {
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        CONCAT(u.first_name, ' ', u.last_name) as username,
        u.is_active,
        u.is_suspended,
        u.is_mfa_enabled,
        u.tenant_id,
        u.parent_id,
        u.system_role_id,
        u.created_at,
        u.updated_at,
        t.name as tenant_name,
        r.name as system_role_name
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      LEFT JOIN roles r ON u.system_role_id = r.id
      WHERE LOWER(CONCAT(u.first_name, ' ', u.last_name)) = LOWER($1)
    `;
    
    const result = await this.db.query(query, [username]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phoneNumber: user.phone_number,
      username: user.username,
      isActive: user.is_active,
      isSuspended: user.is_suspended,
      isMfaEnabled: user.is_mfa_enabled,
      tenantId: user.tenant_id,
      parentId: user.parent_id,
      systemRoleId: user.system_role_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      tenant: user.tenant_name ? {
        id: user.tenant_id,
        name: user.tenant_name
      } : null,
      systemRole: user.system_role_name
    };
  }

  async getParentOptions(tenantId: string) {
    const query = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        system_role_id,
        CONCAT(first_name, ' ', last_name) as full_name
      FROM users 
      WHERE tenant_id = $1 
      AND is_active = true 
      AND system_role_id IS NOT NULL
      ORDER BY first_name, last_name
    `;
    
    const result = await this.db.query(query, [tenantId]);
    return result.rows;
  }
}