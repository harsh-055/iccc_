import {
  Injectable,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DefaultRolesService } from '../role/service/default-role.service';
// import { InjectRedis } from '@nestjs-modules/ioredis';
// import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    private readonly database: DatabaseService,
    @Inject(forwardRef(() => DefaultRolesService))
    private defaultRolesService: DefaultRolesService,
    // @InjectRedis() private readonly redisService: Redis,
  ) {
    // 🚀 CACHING DISABLED: Removed memory cache cleanup interval
  }

  /**
   * 🏗️ SIMPLIFIED ROLE HIERARCHY LEVELS
   * Higher number = higher privilege
   * Simplified for Admin/User system
   */
  private readonly ROLE_HIERARCHY = {
    USER: 1,
    ADMIN: 2,
  };

  /**
   * 🔐 HIERARCHICAL PERMISSION CHECK
   * Enhanced permission check that enforces hierarchy rules
   * Simplified for Admin/User system
   */
  async hasHierarchicalPermission(
    userId: string,
    resource: string,
    action: string,
    targetUserId?: string,
    targetLevel?: number,
  ): Promise<boolean> {
    try {
      // 1. Check if user has the basic permission
      const hasBasicPermission = await this.hasPermission(
        userId,
        resource,
        action,
      );
      if (!hasBasicPermission) {
        return false;
      }

      // 2. Get user's hierarchy level
      const userLevel = await this.getUserHierarchyLevel(userId);
      if (userLevel === 0) {
        return false; // Invalid user
      }

      // 3. For user management operations, enforce hierarchy
      if (
        resource === 'users' &&
        ['create', 'update', 'delete'].includes(action)
      ) {
        if (targetUserId) {
          const targetUserLevel =
            await this.getUserHierarchyLevel(targetUserId);

          // Can only manage users at lower levels (userLevel > targetUserLevel)
          if (userLevel <= targetUserLevel) {
            this.logger.warn(
              `Hierarchy violation: User level ${userLevel} cannot manage user level ${targetUserLevel}`,
            );
            return false;
          }
        }

        if (targetLevel) {
          // Can only create users at lower levels
          if (userLevel <= targetLevel) {
            this.logger.warn(
              `Hierarchy violation: User level ${userLevel} cannot create user at level ${targetLevel}`,
            );
            return false;
          }
        }
      }

      // 4. For role management operations, enforce hierarchy
      if (
        resource === 'roles' &&
        ['create', 'update', 'delete'].includes(action)
      ) {
        // Only ADMIN can manage roles
        if (userLevel < 2) {
          this.logger.warn(
            `Hierarchy violation: User level ${userLevel} cannot manage roles`,
          );
          return false;
        }
      }

      // 5. For tenant management operations, enforce hierarchy
      if (resource === 'tenants') {
        // Only ADMIN can manage tenants
        if (userLevel < 2) {
          this.logger.warn(
            `Hierarchy violation: User level ${userLevel} cannot manage tenants`,
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error checking hierarchical permission: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * 📊 Get user's hierarchy level (simplified for Admin/User system)
   */
  private async getUserHierarchyLevel(userId: string): Promise<number> {
    try {
      // Get user with their roles
      const userResult = await this.database.query(
        `
        SELECT u.*,
               COALESCE(
                 json_agg(
                   DISTINCT jsonb_build_object(
                     'id', r.id,
                     'name', r.name
                   )
                 ) FILTER (WHERE r.id IS NOT NULL), 
                 '[]'::json
               ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1
        GROUP BY u.id
      `,
        [userId],
      );

      if (userResult.rows.length === 0) {
        return 0;
      }

      const user = userResult.rows[0];
      const roles = user.roles || [];

      // Check for Admin role
      const hasAdminRole = roles.some((role) =>
        role.name.toLowerCase().includes('admin'),
      );

      if (hasAdminRole) {
        return 2; // ADMIN level
      }

      // Default to User level
      return 1; // USER level
    } catch (error) {
      this.logger.error(`Error getting user hierarchy level: ${error.message}`);
      return 0;
    }
  }

  /**
   * ✅ Check hierarchical permission and throw exception if not authorized
   */
  async checkHierarchicalPermission(
    userId: string,
    resource: string,
    action: string,
    targetUserId?: string,
    targetLevel?: number,
  ): Promise<void> {
    const hasPermission = await this.hasHierarchicalPermission(
      userId,
      resource,
      action,
      targetUserId,
      targetLevel,
    );

    if (!hasPermission) {
      const userLevel = await this.getUserHierarchyLevel(userId);
      throw new ForbiddenException({
        message: `Hierarchical permission denied: ${action} ${resource}`,
        details: {
          userLevel,
          action,
          resource,
          reason: 'Insufficient hierarchy level or permission denied',
        },
      });
    }
  }

  /**
   * 🔍 Get users that current user can manage (hierarchy-based)
   * Simplified for Admin/User system
   */
  async getManageableUsers(userId: string): Promise<string[]> {
    try {
      const userLevel = await this.getUserHierarchyLevel(userId);

      if (userLevel === 0) {
        return [];
      }

      if (userLevel === 1) {
        // Users cannot manage other users
        return [];
      }

      // Admins can manage all users
      const allUsersResult = await this.database.query(
        `SELECT id FROM users`,
        [],
      );

      return allUsersResult.rows.map((user) => user.id);
    } catch (error) {
      this.logger.error(`Error getting manageable users: ${error.message}`);
      return [];
    }
  }

  // 🚀 CACHING DISABLED: Removed memory cache properties for security and reliability

  /**
   * OPTIMIZED: Check permission with simple Redis cache (90% less Redis ops)
   * Simplified for Admin/User system
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    // 🚀 CACHING DISABLED: Direct database lookup for security and reliability
    // This ensures permissions are always accurate and up-to-date
    return await this.checkPermissionFromDB(userId, resource, action);
  }

  /**
   * Internal method to check permission from database
   * Updated for DatabaseService with raw SQL
   */
  private async checkPermissionFromDB(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    try {
      // Get user with all their permissions from various sources
      const userResult = await this.database.query(
        `
        SELECT u.*,
               -- Direct permissions
               COALESCE(
                 (SELECT json_agg(
                   jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action
                   )
                 )
                 FROM user_permissions up
                 JOIN permissions p ON up.permission_id = p.id
                 WHERE up.user_id = u.id), '[]'::json
               ) as direct_permissions,
               -- Role permissions
               COALESCE(
                 (SELECT json_agg(
                   DISTINCT jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action
                   )
                 )
                 FROM user_roles ur
                 JOIN roles r ON ur.role_id = r.id
                 JOIN role_permissions rp ON r.id = rp.role_id
                 JOIN permissions p ON rp.permission_id = p.id
                 WHERE ur.user_id = u.id), '[]'::json
               ) as role_permissions
        FROM users u
        WHERE u.id = $1
      `,
        [userId],
      );

      if (userResult.rows.length === 0) {
        console.log(`[RBAC] User not found for userId=${userId}`);
        return false;
      }

      const user = userResult.rows[0];

      // Check if user is an admin (simplified from super admin)
      const isAdmin = await this.isAdminCached(userId);
      if (isAdmin) {
        return true;
      }

      // Check direct permissions
      const directPermissions = user.direct_permissions || [];
      const hasDirectPermission = directPermissions.some(
        (permission) =>
          permission.resource === resource && permission.action === action,
      );

      if (hasDirectPermission) {
        return true;
      }

      // Check role permissions
      const rolePermissions = user.role_permissions || [];
      const hasRolePermission = rolePermissions.some(
        (permission) =>
          permission.resource === resource && permission.action === action,
      );

      return hasRolePermission;
    } catch (error) {
      this.logger.error(`Error checking permission from DB: ${error.message}`);
      return false;
    }
  }

  /**
   * 🚀 CACHING DISABLED: Direct admin check for security and reliability
   * Simplified from super admin to admin
   */
  private async isAdminCached(userId: string): Promise<boolean> {
    // Direct database lookup - no caching to ensure accuracy
    return await this.defaultRolesService.isAdmin(userId);
  }

  /**
   * Clear user permission cache (call this when user permissions change)
   * OPTIMIZED: Uses the new invalidateUserCache method
   */
  async clearUserPermissionCache(userId: string): Promise<void> {
    await this.invalidateUserCache(userId);
  }

  /**
   * Warm up cache for common permissions for a user
   */
  async warmUpUserPermissionCache(
    userId: string,
    commonPermissions: Array<{ resource: string; action: string }>,
  ): Promise<void> {
    // Pre-load common permissions into cache
    await Promise.all(
      commonPermissions.map(({ resource, action }) =>
        this.hasPermission(userId, resource, action),
      ),
    );
  }

  /**
   * Clear all RBAC cache - FULLY OPTIMIZED: No KEYS operations
   * OPTIMIZED: Uses only SET-based tracking and SCAN, no expensive KEYS scans
   */
  async clearAllRbacCache(): Promise<void> {
    try {
      // Get all tracked cache keys from the master tracking set
      // const allTrackedKeys = await this.redisService.smembers('rbac_all_keys');
      // if (allTrackedKeys.length > 0) {
      //   // Delete all tracked keys in batches to avoid memory issues
      //   const batchSize = 100;
      //   for (let i = 0; i < allTrackedKeys.length; i += batchSize) {
      //     const batch = allTrackedKeys.slice(i, i + batchSize);
      //     await this.redisService.del(...batch);
      //   }
      //   // Clear the master tracking set
      //   await this.redisService.del('rbac_all_keys');
      // }
      // Get user-specific tracking sets using SCAN instead of KEYS
      // let cursor = '0';
      // const userTrackingSets: string[] = [];
      // do {
      //   const result = await this.redisService.scan(cursor, 'MATCH', 'rbac_keys:*', 'COUNT', 100);
      //   cursor = result[0];
      //   userTrackingSets.push(...result[1]);
      // } while (cursor !== '0');
      // Clean up user tracking sets
      // if (userTrackingSets.length > 0) {
      //   await this.redisService.del(...userTrackingSets);
      // }
      // this.logger.log(`Cleared ${allTrackedKeys.length} RBAC cache keys and ${userTrackingSets.length} tracking sets`);
    } catch (error) {
      this.logger.error('Error clearing RBAC cache:', error);

      // Final fallback: clear specific patterns with SCAN (no KEYS)
      try {
        // const patterns = ['rbac:*', 'admin:*', 'rbac_keys:*']; // Changed from superadmin to admin
        // for (const pattern of patterns) {
        //   let cursor = '0';
        //   do {
        //     const result = await this.redisService.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        //     cursor = result[0];
        //     if (result[1].length > 0) {
        //       await this.redisService.del(...result[1]);
        //     }
        //   } while (cursor !== '0');
        // }
        this.logger.log('Fallback RBAC cache clear completed using SCAN');
      } catch (fallbackError) {
        this.logger.error(
          'Even fallback RBAC cache clear failed:',
          fallbackError,
        );
      }
    }
  }

  /**
   * Clear all RBAC cache for immediate effect after permission changes
   */
  async clearAllUserCaches(): Promise<void> {
    try {
      // 🚀 CACHING DISABLED: No memory cache to clear
      // Clear Redis cache using pattern matching
      // const patterns = ['rbac:*', 'admin:*']; // Changed from superadmin to admin
      // for (const pattern of patterns) {
      //   let cursor = '0';
      //   const keysToDelete: string[] = [];
      //   do {
      //     const result = await this.redisService.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      //     cursor = result[0];
      //     keysToDelete.push(...result[1]);
      //   } while (cursor !== '0');
      //   if (keysToDelete.length > 0) {
      //     // Delete keys in batches to avoid memory issues
      //     const batchSize = 100;
      //     for (let i = 0; i < keysToDelete.length; i += batchSize) {
      //       const batch = keysToDelete.slice(i, i + batchSize);
      //       await this.redisService.del(...batch);
      //     }
      //   }
      // }
      // this.logger.log('All RBAC caches cleared successfully');
    } catch (error) {
      this.logger.error('Error clearing all RBAC caches:', error);
    }
  }

  /**
   * Check permission and throw ForbiddenException if not authorized
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<void> {
    const hasPermission = await this.hasPermission(userId, resource, action);

    if (!hasPermission) {
      throw new ForbiddenException(
        `User does not have permission to ${action} ${resource}`,
      );
    }
  }

  /**
   * Create a new role (requires permission to create roles)
   * Simplified for Admin/User system
   */
  async createRole(
    creatorId: string,
    name: string,
    description: string,
    permissionIds: string[],
    tenantId?: string,
  ) {
    // Check if user has permission to create roles
    await this.checkPermission(creatorId, 'roles', 'create');

    // Create the role
    const roleResult = await this.database.query(
      `INSERT INTO roles (name, description, is_system, tenant_id, created_by, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [name, description, false, tenantId, creatorId],
    );

    const role = roleResult[0];

    // Assign permissions to the role
    if (permissionIds && permissionIds.length > 0) {
      for (const permissionId of permissionIds) {
        await this.database.query(
          `INSERT INTO role_permissions (role_id, permission_id, assigned_at) 
           VALUES ($1, $2, NOW())`,
          [role.id, permissionId],
        );
      }
    }

    return role;
  }

  /**
   * Assign a role to a user (requires permission to manage user roles)
   */
  async assignRoleToUser(adminId: string, userId: string, roleId: string) {
    // Check if admin has permission to assign roles
    await this.checkPermission(adminId, 'user-roles', 'create');

    // Assign role to user
    const result = await this.database.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_at) 
       VALUES ($1, $2, NOW()) RETURNING *`,
      [userId, roleId],
    );

    return result[0];
  }

  /**
   * Check if user can perform action on their own resource
   */
  async canEditSelf(userId: string, action: string): Promise<boolean> {
    // Check if user has explicit self-edit permission
    const selfPermissionNames = [
      'UPDATE_OWN_PROFILE',
      'CHANGE_OWN_PASSWORD',
      'VIEW_OWN_PROFILE',
      'UPDATE_OWN_SETTINGS',
      'VIEW_OWN_DATA',
      'DELETE_OWN_SESSIONS',
    ];

    // For specific self-edit actions, check if user has corresponding permission
    for (const permissionName of selfPermissionNames) {
      if (
        action.includes('own') ||
        permissionName.includes(action.toUpperCase())
      ) {
        const hasPermission = await this.hasPermissionByName(
          userId,
          permissionName,
        );
        if (hasPermission) {
          return true;
        }
      }
    }

    // Default self-edit rules (users can always read their own profile)
    if (action === 'read_own' || action === 'view_own') {
      return true;
    }

    return false;
  }

  /**
   * OPTIMIZED: Check permission by name with memory + simple Redis cache
   */
  async hasPermissionByName(
    userId: string,
    permissionName: string,
  ): Promise<boolean> {
    // 🚀 CACHING DISABLED: Direct database lookup for security and reliability
    // This ensures permissions are always accurate and up-to-date
    return await this.checkPermissionByNameFromDB(userId, permissionName);
  }

  /**
   * Internal method to check permission by name from database
   * Updated for DatabaseService with raw SQL
   */
  private async checkPermissionByNameFromDB(
    userId: string,
    permissionName: string,
  ): Promise<boolean> {
    try {
      // Get user with all their permissions from various sources
      const userResult = await this.database.query(
        `
        SELECT u.*,
               -- Direct permissions by name
               COALESCE(
                 (SELECT json_agg(
                   jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action
                   )
                 )
                 FROM user_permissions up
                 JOIN permissions p ON up.permission_id = p.id
                 WHERE up.user_id = u.id), '[]'::json
               ) as direct_permissions,
               -- Role permissions by name
               COALESCE(
                 (SELECT json_agg(
                   DISTINCT jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action
                   )
                 )
                 FROM user_roles ur
                 JOIN roles r ON ur.role_id = r.id
                 JOIN role_permissions rp ON r.id = rp.role_id
                 JOIN permissions p ON rp.permission_id = p.id
                 WHERE ur.user_id = u.id), '[]'::json
               ) as role_permissions
        FROM users u
        WHERE u.id = $1
      `,
        [userId],
      );

      if (userResult.rows.length === 0) {
        return false;
      }

      const user = userResult.rows[0];

      // Check if user is an admin
      const isAdmin = await this.isAdminCached(userId);
      if (isAdmin) {
        return true;
      }

      // Check direct permissions by name
      const directPermissions = user.direct_permissions || [];
      const hasDirectPermission = directPermissions.some(
        (permission) => permission.name === permissionName,
      );

      if (hasDirectPermission) {
        return true;
      }

      // Check role permissions by name
      const rolePermissions = user.role_permissions || [];
      const hasRolePermission = rolePermissions.some(
        (permission) => permission.name === permissionName,
      );

      return hasRolePermission;
    } catch (error) {
      this.logger.error(
        `Error checking permission by name from DB: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Get all permissions for a user (including those from roles)
   * Simplified for Admin/User system
   */
  async getUserPermissions(userId: string) {
    try {
      const userResult = await this.database.query(
        `
        SELECT u.*,
               -- Direct permissions
               COALESCE(
                 (SELECT json_agg(
                   jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action,
                     'description', p.description
                   )
                 )
                 FROM user_permissions up
                 JOIN permissions p ON up.permission_id = p.id
                 WHERE up.user_id = u.id), '[]'::json
               ) as direct_permissions,
               -- Role permissions
               COALESCE(
                 (SELECT json_agg(
                   DISTINCT jsonb_build_object(
                     'id', p.id,
                     'name', p.name,
                     'resource', p.resource,
                     'action', p.action,
                     'description', p.description
                   )
                 )
                 FROM user_roles ur
                 JOIN roles r ON ur.role_id = r.id
                 JOIN role_permissions rp ON r.id = rp.role_id
                 JOIN permissions p ON rp.permission_id = p.id
                 WHERE ur.user_id = u.id), '[]'::json
               ) as role_permissions,
               -- User roles
               COALESCE(
                 (SELECT json_agg(
                   DISTINCT jsonb_build_object(
                     'id', r.id,
                     'name', r.name
                   )
                 )
                 FROM user_roles ur
                 JOIN roles r ON ur.role_id = r.id
                 WHERE ur.user_id = u.id), '[]'::json
               ) as roles
        FROM users u
        WHERE u.id = $1
      `,
        [userId],
      );

      if (userResult.rows.length === 0) {
        return [];
      }

      const user = userResult.rows[0];
      const directPermissions = user.direct_permissions || [];
      const rolePermissions = user.role_permissions || [];

      // Combine permissions, avoiding duplicates
      const allPermissions = [...directPermissions];

      // Add role permissions (avoiding duplicates)
      rolePermissions.forEach((rolePermission) => {
        if (
          !allPermissions.some(
            (p) =>
              p.resource === rolePermission.resource &&
              p.action === rolePermission.action,
          )
        ) {
          allPermissions.push(rolePermission);
        }
      });

      // Log for debugging (simplified)
      this.logger.debug(`[RBAC] getUserPermissions for userId=${userId}:`, {
        directPermissions: directPermissions.length,
        rolePermissions: rolePermissions.length,
        totalPermissions: allPermissions.length,
        roles: (user.roles || []).map((r) => r.name),
      });

      return allPermissions;
    } catch (error) {
      this.logger.error(`Error getting user permissions: ${error.message}`);
      return [];
    }
  }

  /**
   * Determine role type from role names (simplified for Admin/User system)
   */
  private determineRoleTypeFromRoles(roleNames: string[]): string | null {
    if (!roleNames || roleNames.length === 0) {
      return null;
    }

    const lowerRoleNames = roleNames.map((name) => name.toLowerCase());

    // Check for Admin
    if (lowerRoleNames.some((name) => name.includes('admin'))) {
      return 'ADMIN';
    }

    // Default to User
    return 'USER';
  }

  /**
   * 🚀 CACHING DISABLED: Simplified user cache invalidation (Redis only)
   */
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      // 🚀 CACHING DISABLED: No memory cache to clear
      // Clear Redis cache with simple pattern scan (no complex tracking sets)
      // const patterns = [`rbac:${userId}:*`, `admin:${userId}`]; // Changed from superadmin to admin
      // for (const pattern of patterns) {
      //   let cursor = '0';
      //   const keysToDeleteFromRedis: string[] = [];
      //   do {
      //     const result = await this.redisService.scan(cursor, 'MATCH', pattern, 'COUNT', 50);
      //     cursor = result[0];
      //     keysToDeleteFromRedis.push(...result[1]);
      //   } while (cursor !== '0');
      //   if (keysToDeleteFromRedis.length > 0) {
      //     await this.redisService.del(...keysToDeleteFromRedis);
      //   }
      // }
    } catch (error) {
      console.warn('[RBAC] Error invalidating user cache:', error.message);
    }
  }
}
