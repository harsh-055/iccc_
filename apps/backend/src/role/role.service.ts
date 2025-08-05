import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DatabaseService } from '../../database/database.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class RoleService {
  constructor(
    private database: DatabaseService,
    @Inject(forwardRef(() => RbacService))
    private rbacService: RbacService
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name, description, permissionIds, tenantId } = createRoleDto;

    // Check if role name already exists in this tenant
    const existingRoleResult = await this.database.query(
      `SELECT id FROM roles WHERE name = $1 AND tenant_id = $2`,
      [name, tenantId || null]
    );

    if (existingRoleResult.rows.length > 0) {
      throw new ConflictException(`Role with name "${name}" already exists in this tenant`);
    }

    // Create the role
    const roleResult = await this.database.query(
      `INSERT INTO roles (name, description, tenant_id, is_system, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [name, description, tenantId, false] // is_system = false for custom roles
    );

    if (!roleResult || roleResult.rows.length === 0) {
      throw new InternalServerErrorException('Failed to create role - no result returned from database');
    }

    const role = roleResult.rows[0];

    // Connect permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      for (const permissionId of permissionIds) {
        try {
          await this.database.query(
            `INSERT INTO role_permissions (role_id, permission_id, assigned_at) 
             VALUES ($1, $2, NOW())`,
            [role.id, permissionId]
          );
        } catch (error) {
          // If permission assignment fails, clean up the created role
          await this.database.query(`DELETE FROM roles WHERE id = $1`, [role.id]);
          throw new BadRequestException(`Failed to assign permission ${permissionId} to role: ${error.message}`);
        }
      }
    }

    // Note: User assignment is now handled separately via assignRoleToUser/assignRoleToUsers methods
    // This keeps role creation focused on role definition only

    // Return just the created role data (no users yet)
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      tenant_id: role.tenant_id,
      is_system: role.is_system,
      is_active: role.is_active,
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions: permissionIds && permissionIds.length > 0 ? 
        await this.getRolePermissions(role.id) : [],
      users: [], // No users assigned yet
      user_count: 0
    };
  }

  private async getRolePermissions(roleId: string) {
    const permissionsResult = await this.database.query(`
      SELECT p.id, p.name, p.resource, p.action, p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `, [roleId]);

    return permissionsResult.rows.map(p => ({
      id: p.id,
      name: p.name,
      resource: p.resource,
      action: p.action,
      description: p.description
    }));
  }

  async findAll() {
    const rolesResult = await this.database.query(`
      SELECT r.*,
             COUNT(DISTINCT ur.user_id) as user_count,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'permission_id', rp.permission_id,
                   'permission', jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action,
                     'description', p.description
                   )
                 )
               ) FILTER (WHERE rp.permission_id IS NOT NULL), 
               '[]'::json
             ) as permissions,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email
                 )
               ) FILTER (WHERE u.id IS NOT NULL), 
               '[]'::json
             ) as users
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN users u ON ur.user_id = u.id
      GROUP BY r.id
      ORDER BY r.name ASC
    `);

    // Add status field for backward compatibility
    return rolesResult.map(role => ({
      ...role,
      status: role.is_active || true, // Default to true if is_active doesn't exist
      _count: { userRoles: role.user_count || 0 },
      userRoles: (role.users || []).map(user => ({ user }))
    }));
  }

  async findCustomRoles() {
    const customRolesResult = await this.database.query(`
      SELECT r.*,
             COUNT(DISTINCT ur.user_id) as user_count,
             COUNT(DISTINCT rp.permission_id) as permission_count,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'permission_id', rp.permission_id,
                   'permission', jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action,
                     'description', p.description
                   )
                 )
               ) FILTER (WHERE rp.permission_id IS NOT NULL), 
               '[]'::json
             ) as permissions,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email
                 )
               ) FILTER (WHERE u.id IS NOT NULL), 
               '[]'::json
             ) as users
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN users u ON ur.user_id = u.id
      WHERE r.is_system = false
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);

    return customRolesResult.map(role => ({
      ...role,
      _count: {
        permissions: role.permission_count || 0,
        userRoles: role.user_count || 0
      },
      userRoles: (role.users || []).map(user => ({ user }))
    }));
  }

  async findBasic() {
    const basicRolesResult = await this.database.query(`
      SELECT id, name FROM roles ORDER BY name ASC
    `);

    return basicRolesResult;
  }

  async findByTenant(tenantId: string) {
    // Verify tenant exists
    const tenantResult = await this.database.query(
      `SELECT id FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.length === 0) {
      throw new NotFoundException(`Tenant with ID "${tenantId}" not found`);
    }

    const rolesResult = await this.database.query(`
      SELECT r.*,
             COUNT(DISTINCT ur.user_id) as user_count,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'permission_id', rp.permission_id,
                   'permission', jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action,
                     'description', p.description
                   )
                 )
               ) FILTER (WHERE rp.permission_id IS NOT NULL), 
               '[]'::json
             ) as permissions,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email,
                   'is_active', u.is_active
                 )
               ) FILTER (WHERE u.id IS NOT NULL), 
               '[]'::json
             ) as users
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN users u ON ur.user_id = u.id
      WHERE r.tenant_id = $1
      GROUP BY r.id
      ORDER BY r.name ASC
    `, [tenantId]);

    return rolesResult.map(role => ({
      ...role,
      _count: { userRoles: role.user_count || 0 },
      userRoles: (role.users || []).map(user => ({ user }))
    }));
  }

  async findOne(id: string) {
    const roleResult = await this.database.query(`
      SELECT r.*,
             COUNT(DISTINCT ur.user_id) as user_count,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'permission_id', rp.permission_id,
                   'permission', jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action,
                     'description', p.description
                   )
                 )
               ) FILTER (WHERE rp.permission_id IS NOT NULL), 
               '[]'::json
             ) as permissions,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email,
                   'is_active', u.is_active
                 )
               ) FILTER (WHERE u.id IS NOT NULL), 
               '[]'::json
             ) as users
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN users u ON ur.user_id = u.id
      WHERE r.id = $1
      GROUP BY r.id
    `, [id]);

    if (roleResult.length === 0) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    const role = roleResult[0];

    // Add status field for backward compatibility
    return {
      ...role,
      status: role.is_active || true,
      _count: { userRoles: role.user_count || 0 },
      userRoles: (role.users || []).map(user => ({ user }))
    };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { name, description, permissionIds, tenantId, userIds, isActive, status } = updateRoleDto;
    
    // Handle both status and isActive fields (status takes precedence for backward compatibility)
    const activeStatus = status !== undefined ? status : isActive;

    // Verify role exists and get its current tenantId
    const currentRole = await this.findOne(id);

    // If name is being updated, check for duplicates
    if (name) {
      const existingRoleResult = await this.database.query(
        `SELECT id FROM roles WHERE name = $1 AND tenant_id = $2 AND id != $3`,
        [name, tenantId || currentRole.tenant_id, id]
      );

      if (existingRoleResult.rows.length > 0) {
        throw new ConflictException(`Role with name "${name}" already exists in this tenant`);
      }
    }

    // Validate users exist if userIds provided
    if (userIds && userIds.length > 0) {
      const existingUsersResult = await this.database.query(
        `SELECT id FROM users WHERE id = ANY($1::uuid[])`,
        [userIds]
      );

      const existingUserIds = existingUsersResult.rows.map(user => user.id);
      const nonExistentUserIds = userIds.filter(id => !existingUserIds.includes(id));
      
      if (nonExistentUserIds.length > 0) {
        throw new NotFoundException(`Users not found: ${nonExistentUserIds.join(', ')}`);
      }
    }

    // Get all users with this role before making changes
    const previousUsersResult = await this.database.query(
      `SELECT user_id FROM user_roles WHERE role_id = $1`,
      [id]
    );

    // Update the role
    await this.database.query(
      `UPDATE roles 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           tenant_id = COALESCE($3, tenant_id),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5`,
      [name, description, tenantId, activeStatus, id]
    );

    // Update permissions if provided
    if (permissionIds !== undefined) {
      // Delete current role-permission relationships
      await this.database.query(
        `DELETE FROM role_permissions WHERE role_id = $1`,
        [id]
      );

      // Create new role-permission relationships
      if (permissionIds.length > 0) {
        for (const permissionId of permissionIds) {
          await this.database.query(
            `INSERT INTO role_permissions (role_id, permission_id, assigned_at) 
             VALUES ($1, $2, NOW())`,
            [id, permissionId]
          );
        }
      }
    }

        // Update user assignments if provided
    if (userIds !== undefined) {
      // Remove all existing user-role relationships for this role
      await this.database.query(
        `DELETE FROM user_roles WHERE role_id = $1`,
        [id]
      );

      // Create new user-role relationships
      if (userIds.length > 0) {
        for (const userId of userIds) {
          await this.database.query(
            `INSERT INTO user_roles (user_id, role_id, assigned_at) 
             VALUES ($1, $2, NOW())`,
            [userId, id]
          );
        }
      }

      // Clear RBAC cache for all affected users (both previous and new)
      const allAffectedUserIds = [
        ...previousUsersResult.rows.map(ur => ur.user_id),
        ...userIds
      ];
      const uniqueAffectedUserIds = [...new Set(allAffectedUserIds)];

      for (const userId of uniqueAffectedUserIds) {
        await this.rbacService.clearUserPermissionCache(userId);
      }
    } else if (permissionIds !== undefined) {
      // If only permissions were updated, clear cache for existing users
      for (const userRole of previousUsersResult.rows) {
        await this.rbacService.clearUserPermissionCache(userRole.user_id);
      }
    }

    // Return the updated role with permissions and users
    const updatedRole = await this.findOne(id);

    // Add status field for backward compatibility
    return {
      ...updatedRole,
      status: updatedRole.is_active
    };
  }

  async remove(id: string) {
    // Verify role exists and get user assignments before deletion
    const role = await this.findOne(id);

    // Get all users with this role before deletion for cache clearing
    const usersWithRoleResult = await this.database.query(
      `SELECT user_id FROM user_roles WHERE role_id = $1`,
      [id]
    );

    // Remove user-role relationships
    await this.database.query(
      `DELETE FROM user_roles WHERE role_id = $1`,
      [id]
    );

    // Remove role-permission relationships
    await this.database.query(
      `DELETE FROM role_permissions WHERE role_id = $1`,
      [id]
    );

    // Clear RBAC cache for all users who had this role
    if (usersWithRoleResult.length > 0) {
      for (const userRole of usersWithRoleResult) {
        await this.rbacService.clearUserPermissionCache(userRole.user_id);
      }
    }

    // Remove the role
    await this.database.query(
      `DELETE FROM roles WHERE id = $1`,
      [id]
    );

    return { message: `Role with ID "${id}" deleted successfully` };
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string) {
    // Verify user exists
    const userResult = await this.database.query(
      `SELECT id FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.length === 0) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Verify role exists
    await this.findOne(roleId);

    // Check if assignment already exists
    const existingAssignmentResult = await this.database.query(
      `SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2`,
      [userId, roleId]
    );

    if (existingAssignmentResult.length === 0) {
      // Create user-role relationship
      await this.database.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at) 
         VALUES ($1, $2, NOW())`,
        [userId, roleId]
      );
    }

    // Clear RBAC cache for the user since their permissions changed
    await this.rbacService.clearUserPermissionCache(userId);

    // Return the user with roles
    const userWithRolesResult = await this.database.query(`
      SELECT u.*,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'role', jsonb_build_object(
                     'id', r.id,
                     'name', r.name,
                     'description', r.description,
                     'permissions', COALESCE(
                       (SELECT json_agg(
                         jsonb_build_object(
                           'permission', jsonb_build_object(
                             'id', p.id,
                             'name', p.name,
                             'resource', p.resource,
                             'action', p.action
                           )
                         )
                       )
                       FROM role_permissions rp2
                       JOIN permissions p ON rp2.permission_id = p.id
                       WHERE rp2.role_id = r.id), '[]'::json
                     )
                   )
                 )
               ) FILTER (WHERE r.id IS NOT NULL), 
               '[]'::json
             ) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);

    return userWithRolesResult[0];
  }

  /**
   * Assign a role to multiple users
   */
  async assignRoleToUsers(userIds: string[], roleId: string) {
    // Verify all users exist
    const usersResult = await this.database.query(
      `SELECT id FROM users WHERE id = ANY($1::uuid[])`,
      [userIds]
    );

          const foundUserIds = usersResult.rows.map(user => user.id);
    const notFoundUserIds = userIds.filter(id => !foundUserIds.includes(id));

    if (notFoundUserIds.length > 0) {
      throw new NotFoundException(`Users not found: ${notFoundUserIds.join(', ')}`);
    }

    // Verify role exists
    await this.findOne(roleId);

    // Check for existing assignments to avoid duplicates
    const existingAssignmentsResult = await this.database.query(
      `SELECT user_id FROM user_roles WHERE user_id = ANY($1::uuid[]) AND role_id = $2`,
      [userIds, roleId]
    );

          const existingUserIds = existingAssignmentsResult.rows.map(assignment => assignment.user_id);
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    // Create user-role relationships for users who don't already have this role
    if (newUserIds.length > 0) {
      for (const userId of newUserIds) {
        await this.database.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_at) 
           VALUES ($1, $2, NOW())`,
          [userId, roleId]
        );
      }

      // Clear RBAC cache for all affected users
      for (const userId of newUserIds) {
        await this.rbacService.clearUserPermissionCache(userId);
      }
    }

    // Return summary of assignments
    const assignedUsersResult = await this.database.query(
      `SELECT id, name, email FROM users WHERE id = ANY($1::uuid[])`,
      [userIds]
    );

    const role = await this.findOne(roleId);

    return {
      totalUsers: userIds.length,
      newAssignments: newUserIds.length,
      existingAssignments: existingUserIds.length,
      assignedUsers: assignedUsersResult,
      role
    };
  }

  /**
   * Get users and permissions by role ID
   */
  async getUsersAndPermissionsByRoleId(roleId: string) {
    // Verify role exists
    const role = await this.findOne(roleId);

    // Get users with this role
    const usersResult = await this.database.query(`
      SELECT u.id, u.email, u.name
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.role_id = $1
    `, [roleId]);

    // Get permissions for this role
    const permissionsResult = await this.database.query(`
      SELECT p.*
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `, [roleId]);

    return {
      role,
      users: usersResult,
      permissions: permissionsResult
    };
  }

  /**
   * Generate a unique 8-10 digit account ID
   */
  private async generateUniqueAccountId(): Promise<string> {
    let accountId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Generate a random 8-10 digit account ID
      const randomNum = Math.floor(Math.random() * 9999999999); // Up to 10 digits
      accountId = randomNum.toString().padStart(8, '0'); // Ensure minimum 8 digits
      
      // Check if this account ID already exists
      const existingUserResult = await this.database.query(
        `SELECT id FROM users WHERE account_id = $1`,
        [accountId]
      );

      if (existingUserResult.length === 0) {
        return accountId;
      }

      attempts++;
      
    } while (attempts < maxAttempts);

    // If we've reached max attempts, throw an error
    throw new Error('Unable to generate unique account ID after maximum attempts');
  }

  /**
   * Create a tenant admin with all tenant permissions (simplified from SuperAdmin)
   */
  async createTenantAdmin(tenantId: string, userData: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }) {
    // Verify tenant exists
    const tenantResult = await this.database.query(
      `SELECT * FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.length === 0) {
      throw new NotFoundException('Tenant not found');
    }

    const tenant = tenantResult[0];

    // Check if user already exists
    const existingUserResult = await this.database.query(
      `SELECT id FROM users WHERE email = $1`,
      [userData.email]
    );

    if (existingUserResult.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    try {
      // First, ensure tenant has all permissions
      await this.seedTenantPermissions(tenantId);

      // Get or create tenant Admin role
      let tenantAdminRole = await this.database.query(
        `SELECT * FROM roles WHERE name = $1 AND tenant_id = $2`,
        ['Admin', tenantId]
      );

      if (tenantAdminRole.length === 0) {
        const createRoleResult = await this.database.query(
          `INSERT INTO roles (name, description, tenant_id, is_system, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
          ['Admin', `Administrator for ${tenant.name}`, tenantId, false]
        );
        tenantAdminRole = createRoleResult;
      }

      const adminRole = tenantAdminRole[0];

      // Generate unique account ID
      const accountId = await this.generateUniqueAccountId();

      // Create the user
      const userResult = await this.database.query(
        `INSERT INTO users (name, email, account_id, password, phone_number, tenant_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [userData.name, userData.email, accountId, hashedPassword, userData.phoneNumber, tenantId]
      );

      const user = userResult[0];

      // Assign Admin role to user
      await this.database.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at) 
         VALUES ($1, $2, NOW())`,
        [user.id, adminRole.id]
      );

      // Get permissions count
      const permissionsCountResult = await this.database.query(
        `SELECT COUNT(*) as count FROM role_permissions WHERE role_id = $1`,
        [adminRole.id]
      );

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenant_id
        },
        role: {
          id: adminRole.id,
          name: adminRole.name,
          description: adminRole.description,
          tenantId: adminRole.tenant_id
        },
        permissions: permissionsCountResult[0].count
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create tenant admin: ${error.message}`);
    }
  }

  /**
   * Seed all permissions for a specific tenant
   */
  async seedTenantPermissions(tenantId: string) {
    // Verify tenant exists
    const tenantResult = await this.database.query(
      `SELECT * FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.length === 0) {
      throw new NotFoundException('Tenant not found');
    }

    const tenant = tenantResult[0];

    try {
      // Get all permissions (no tenant_id filtering needed)
      const allPermissionsResult = await this.database.query(
        `SELECT * FROM permissions`
      );

      // Use all permissions for tenant roles
      const tenantPermissions = allPermissionsResult;

      // Create tenant-specific roles
      const systemRoles = ['Admin', 'User']; // Simplified from original complex hierarchy
      const tenantRoles = [];

      for (const roleName of systemRoles) {
        let tenantRoleResult = await this.database.query(
          `SELECT * FROM roles WHERE name = $1 AND tenant_id = $2`,
          [roleName, tenantId]
        );

        if (tenantRoleResult.length === 0) {
          // Create tenant role
          const description = roleName === 'Admin' 
            ? `Administrator for ${tenant.name}` 
            : `User for ${tenant.name}`;

          const createRoleResult = await this.database.query(
            `INSERT INTO roles (name, description, tenant_id, is_system, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
            [roleName, description, tenantId, false]
          );

          const tenantRole = createRoleResult[0];

          // Assign appropriate permissions to role
          if (roleName === 'Admin') {
            // Admin gets all permissions
            for (const permission of tenantPermissions) {
              const existingRolePermissionResult = await this.database.query(
                `SELECT * FROM role_permissions WHERE role_id = $1 AND permission_id = $2`,
                [tenantRole.id, permission.id]
              );

              if (existingRolePermissionResult.length === 0) {
                await this.database.query(
                  `INSERT INTO role_permissions (role_id, permission_id, assigned_at) 
                   VALUES ($1, $2, NOW())`,
                  [tenantRole.id, permission.id]
                );
              }
            }
          } else if (roleName === 'User') {
            // User gets only self-service and view permissions
            const userPermissions = tenantPermissions.filter(permission => {
              const action = permission.action.toLowerCase();
              const permissionName = permission.name.toLowerCase();
              
              return action.includes('read') || 
                     action.includes('view') || 
                     permissionName.includes('own') || 
                     permissionName.includes('assigned');
            });

            for (const permission of userPermissions) {
              const existingRolePermissionResult = await this.database.query(
                `SELECT * FROM role_permissions WHERE role_id = $1 AND permission_id = $2`,
                [tenantRole.id, permission.id]
              );

              if (existingRolePermissionResult.length === 0) {
                await this.database.query(
                  `INSERT INTO role_permissions (role_id, permission_id, assigned_at) 
                   VALUES ($1, $2, NOW())`,
                  [tenantRole.id, permission.id]
                );
              }
            }
          }

          tenantRoles.push(tenantRole);
        } else {
          tenantRoles.push(tenantRoleResult[0]);
        }
      }

      return {
        tenantId,
        permissionsCreated: tenantPermissions.length,
        rolesCreated: tenantRoles.length,
        adminRole: tenantRoles.find(r => r.name === 'Admin'),
        tenant: tenant.name
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to seed tenant permissions: ${error.message}`);
    }
  }

  /**
   * Get role permissions by category (simplified for Admin/User system)
   */
  async getRolePermissionsByCategory(tenantId: string, roleId: string) {
    const startTime = Date.now();
    console.log(`🔍 [${new Date().toISOString()}] Starting getRolePermissionsByCategory | RoleId: ${roleId} | TenantId: ${tenantId}`);

    // Verify tenant exists
    const tenantResult = await this.database.query(
      `SELECT * FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.length === 0) {
      throw new NotFoundException(`Tenant with ID "${tenantId}" not found`);
    }

    // Verify role exists and belongs to the tenant
    const roleResult = await this.database.query(
      `SELECT * FROM roles WHERE id = $1 AND tenant_id = $2`,
      [roleId, tenantId]
    );

    if (roleResult.length === 0) {
      throw new NotFoundException(`Role with ID "${roleId}" not found in this tenant`);
    }

    const role = roleResult[0];

    // Get all permissions (no tenant filtering)
    const allTenantPermissionsResult = await this.database.query(
      `SELECT * FROM permissions ORDER BY resource ASC, action ASC`
    );

    // Filter permissions based on role type (Admin gets all, User gets limited)
    const availablePermissions = role.name === 'Admin' 
      ? allTenantPermissionsResult 
      : allTenantPermissionsResult.filter(permission => {
          const action = permission.action.toLowerCase();
          const permissionName = permission.name.toLowerCase();
          
          return action.includes('read') || 
                 action.includes('view') || 
                 permissionName.includes('own') || 
                 permissionName.includes('assigned');
        });

    // Get permissions assigned to this role
    const rolePermissionsResult = await this.database.query(`
      SELECT p.*
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `, [roleId]);

    // Create a set of permission IDs that the role has
    const rolePermissionIds = new Set(rolePermissionsResult.rows.map(p => p.id));

    // Group permissions by category (resource) and format the response
    const permissionsByCategory = {};
    
    availablePermissions.forEach(permission => {
      const category = this.formatCategoryName(permission.resource);
      const permissionName = this.formatPermissionName(permission.action, permission.resource);
      
      if (!permissionsByCategory[category]) {
        permissionsByCategory[category] = [];
      }
      
      permissionsByCategory[category].push({
        id: permission.id,
        category,
        name: permissionName,
        hasAccess: rolePermissionIds.has(permission.id),
        resource: permission.resource,
        action: permission.action
      });
    });

    // Convert to array format
    const permissions = [];
    Object.keys(permissionsByCategory).forEach(category => {
      permissions.push(...permissionsByCategory[category]);
    });

    const duration = Date.now() - startTime;
    console.log(`✅ [${new Date().toISOString()}] getRolePermissionsByCategory completed | Duration: ${duration}ms | RoleId: ${roleId} | RoleType: ${role.name} | Filtered: ${availablePermissions.length}/${allTenantPermissionsResult.length} permissions`);

    return {
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        tenantId: role.tenant_id,
        roleType: role.name // Admin or User
      },
      permissions,
      roleType: role.name,
      totalAvailablePermissions: availablePermissions.length,
      totalAllPermissions: allTenantPermissionsResult.length
    };
  }

  private formatCategoryName(resource: string): string {
    // Convert resource names to user-friendly categories
    const categoryMap = {
      'dashboard': 'Dashboard',

      'device': 'Device Management',
      'user': 'User Management',
      'role': 'Role Management',
      'permission': 'Permission Management',
      'tenant': 'Tenant Management',
      'report': 'Reports',
      'notification': 'Notifications',
      'audit': 'Audit Logs',
      'setting': 'Settings',
      'profile': 'Profile Management',
      'file': 'File Management',
      'export': 'Data Export',
      'import': 'Data Import'
    };

    return categoryMap[resource.toLowerCase()] || resource.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  private formatPermissionName(action: string, resource: string): string {
    // Convert action + resource to user-friendly permission names
    const actionMap = {
      'create': 'Create',
      'read': 'View',
      'update': 'Edit',
      'delete': 'Delete',
      'manage': 'Manage',
      'assign': 'Assign',
      'export': 'Export',
      'import': 'Import',
      'approve': 'Approve',
      'reject': 'Reject'
    };

    const resourceMap = {
      'dashboard': 'Dashboard',

      'device': 'Devices',
      'user': 'Users',
      'role': 'Roles',
      'permission': 'Permissions',
      'tenant': 'Tenants',
      'report': 'Reports',
      'notification': 'Notifications',
      'audit': 'Audit Logs',
      'setting': 'Settings',
      'profile': 'Profile',
      'file': 'Files'
    };

    const formattedAction = actionMap[action.toLowerCase()] || action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const formattedResource = resourceMap[resource.toLowerCase()] || resource.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    return `${formattedAction} ${formattedResource}`;
  }

  /**
   * Clear all RBAC cache for immediate effect after permission changes
   */
  async clearAllRbacCache(): Promise<void> {
    await this.rbacService.clearAllUserCaches();
  }

  /**
   * Update role permissions 
   */
  async updateRolePermissions(tenantId: string, roleId: string, permissionIds: string[]) {
    const startTime = Date.now();
    console.log(`🔄 [${new Date().toISOString()}] Starting updateRolePermissions | RoleId: ${roleId} | TenantId: ${tenantId} | Permissions: ${permissionIds.length}`);

    // Validate tenant exists
    const tenantResult = await this.database.query(
      `SELECT * FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.length === 0) {
      throw new NotFoundException('Tenant not found');
    }

    const tenant = tenantResult[0];

    // Validate role exists and belongs to tenant
    const roleResult = await this.database.query(
      `SELECT * FROM roles WHERE id = $1 AND tenant_id = $2`,
      [roleId, tenantId]
    );

    if (roleResult.length === 0) {
      throw new NotFoundException(`Role with ID "${roleId}" not found in tenant "${tenant.name}"`);
    }

    const role = roleResult[0];

    // Validate that all permission IDs exist and belong to the tenant
    if (permissionIds.length > 0) {
      const validPermissionsResult = await this.database.query(
        `SELECT * FROM permissions WHERE id = ANY($1::uuid[])`,
        [permissionIds]
      );

      if (validPermissionsResult.rows.length !== permissionIds.length) {
        const foundIds = validPermissionsResult.rows.map(p => p.id);
        const invalidIds = permissionIds.filter(id => !foundIds.includes(id));
        throw new ConflictException(`Permission IDs not found in tenant "${tenant.name}": ${invalidIds.join(', ')}`);
      }
    }

    // Get current permissions for comparison
    const currentPermissionsResult = await this.database.query(
      `SELECT p.* FROM role_permissions rp 
       JOIN permissions p ON rp.permission_id = p.id 
       WHERE rp.role_id = $1`,
      [roleId]
    );

    const currentPermissionIds = new Set(currentPermissionsResult.rows.map(p => p.id));
    const newPermissionIds = new Set(permissionIds);

    // Calculate what needs to be added and removed
    const toAdd = permissionIds.filter(id => !currentPermissionIds.has(id));
    const toRemove = currentPermissionsResult.rows
      .filter(p => !newPermissionIds.has(p.id))
      .map(p => p.id);

    // Get all users with this role for cache clearing
    const usersWithRoleResult = await this.database.query(
      `SELECT user_id FROM user_roles WHERE role_id = $1`,
      [roleId]
    );

    // Update permissions in a transaction-like approach
    try {
      // 1. Remove permissions that are no longer needed
      if (toRemove.length > 0) {
        await this.database.query(
          `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = ANY($2::uuid[])`,
          [roleId, toRemove]
        );
      }

      // 2. Add new permissions
      if (toAdd.length > 0) {
        for (const permissionId of toAdd) {
          await this.database.query(
            `INSERT INTO role_permissions (role_id, permission_id, assigned_at) 
             VALUES ($1, $2, NOW())`,
            [roleId, permissionId]
          );
        }
      }

      // 3. Clear RBAC cache for all users with this role since their permissions changed
      for (const userRole of usersWithRoleResult) {
        await this.rbacService.clearUserPermissionCache(userRole.user_id);
      }

      // Get updated role with permissions
      const updatedRoleResult = await this.database.query(`
        SELECT r.*,
               COALESCE(
                 json_agg(
                   DISTINCT jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action
                   )
                 ) FILTER (WHERE p.id IS NOT NULL), 
                 '[]'::json
               ) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE r.id = $1
        GROUP BY r.id
      `, [roleId]);

      const updatedRole = updatedRoleResult[0];

      const duration = Date.now() - startTime;
      console.log(`✅ [${new Date().toISOString()}] updateRolePermissions completed | Duration: ${duration}ms | RoleId: ${roleId} | Added: ${toAdd.length} | Removed: ${toRemove.length} | Total: ${permissionIds.length}`);

      return {
        role: {
          id: updatedRole.id,
          name: updatedRole.name,
          description: updatedRole.description,
          tenantId: updatedRole.tenant_id,
          roleType: updatedRole.name
        },
        permissionsUpdated: {
          added: toAdd.length,
          removed: toRemove.length,
          total: permissionIds.length
        },
        permissions: updatedRole.permissions || []
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update role permissions: ${error.message}`);
    }
  }
}