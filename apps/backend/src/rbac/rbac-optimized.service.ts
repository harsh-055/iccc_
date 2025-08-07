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
export class RbacOptimizedService {
  private readonly logger = new Logger(RbacOptimizedService.name);

  // In-memory cache to reduce Redis operations (reset on server restart)
  // Changed to accept any type of value, not just boolean
  private memoryCache = new Map<string, { value: any; expires: number }>();
  private readonly MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  // private readonly REDIS_CACHE_TTL = 10 * 60; // 10 minutes

  constructor(
    private readonly database: DatabaseService,
    @Inject(forwardRef(() => DefaultRolesService))
    private defaultRolesService: DefaultRolesService,
    // @InjectRedis() private readonly redisService: Redis,
  ) {
    // Clean memory cache every 5 minutes
    setInterval(
      () => {
        this.cleanExpiredMemoryCache();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * OPTIMIZED: Check permission with memory + Redis cache (90% less Redis ops)
   * Updated for Admin/User system
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const cacheKey = `rbac:${userId}:${resource}:${action}`;

    try {
      // 1. Check in-memory cache first (no Redis operation)
      const memoryResult = this.getFromMemoryCache<boolean>(cacheKey);
      if (memoryResult !== null) {
        return memoryResult;
      }

      // 2. Check Redis cache (1 Redis operation instead of 4-5)
      // const cachedResult = await this.redisService.get(cacheKey);
      // if (cachedResult !== null) {
      //   const result = cachedResult === 'true';
      //   // Store in memory cache for next requests
      //   this.setMemoryCache(cacheKey, result);
      //   return result;
      // }

      // 3. Database lookup
      const result = await this.checkPermissionFromDB(userId, resource, action);

      // 4. Cache in both memory and Redis (1 Redis operation instead of 4)
      this.setMemoryCache(cacheKey, result);
      // try {
      //   await this.redisService.setex(cacheKey, this.REDIS_CACHE_TTL, result.toString());
      // } catch (cacheError) {
      //   this.logger.warn('[RBAC] Failed to cache in Redis:', cacheError.message);
      // }

      return result;
    } catch (redisError) {
      this.logger.warn(
        '[RBAC] Redis error, using memory + database fallback:',
        redisError.message,
      );
      return this.checkPermissionFromDB(userId, resource, action);
    }
  }

  /**
   * OPTIMIZED: Admin check with memory cache (simplified from super admin)
   */
  private async isAdminCached(userId: string): Promise<boolean> {
    const cacheKey = `admin:${userId}`;

    try {
      // Check memory cache first
      const memoryResult = this.getFromMemoryCache<boolean>(cacheKey);
      if (memoryResult !== null) {
        return memoryResult;
      }

      // Check Redis cache
      // const cachedResult = await this.redisService.get(cacheKey);
      // if (cachedResult !== null) {
      //   const result = cachedResult === 'true';
      //   this.setMemoryCache(cacheKey, result);
      //   return result;
      // }

      // Database lookup
      const result = await this.defaultRolesService.isAdmin(userId);

      // Cache in both memory and Redis
      this.setMemoryCache(cacheKey, result);
      // try {
      //   await this.redisService.setex(cacheKey, this.REDIS_CACHE_TTL, result.toString());
      // } catch (cacheError) {
      //   this.logger.warn('[RBAC] Failed to cache admin result:', cacheError.message);
      // }

      return result;
    } catch (redisError) {
      this.logger.warn(
        '[RBAC] Redis error in isAdminCached:',
        redisError.message,
      );
      return this.defaultRolesService.isAdmin(userId);
    }
  }

  /**
   * Memory cache operations (zero Redis commands)
   * Made generic to handle different value types
   */
  private getFromMemoryCache<T = any>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.value as T;
  }

  private setMemoryCache(key: string, value: any): void {
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + this.MEMORY_CACHE_TTL,
    });
  }

  private cleanExpiredMemoryCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cached] of this.memoryCache.entries()) {
      if (now > cached.expires) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned ${cleanedCount} expired memory cache entries`);
    }
  }

  /**
   * OPTIMIZED: Clear user cache - simplified approach
   */
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      // Clear memory cache for this user
      const keysToDelete: string[] = [];
      for (const key of this.memoryCache.keys()) {
        if (key.includes(userId)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => this.memoryCache.delete(key));

      // Clear Redis cache with pattern (1 operation per key instead of complex tracking)
      // const patterns = [`rbac:${userId}:*`, `admin:${userId}`];

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
      this.logger.warn('[RBAC] Error invalidating user cache:', error.message);
    }
  }

  /**
   * OPTIMIZED: Clear all cache - simplified approach
   */
  async clearAllRbacCache(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear Redis cache with pattern scan (updated for Admin/User system)
      // const patterns = ['rbac:*', 'admin:*'];

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

      this.logger.log('RBAC cache cleared (memory + Redis)');
    } catch (error) {
      this.logger.error('Error clearing RBAC cache:', error);
    }
  }

  /**
   * Internal method to check permission from database
   * Updated for DatabaseService with simplified Admin/User system
   */
  private async checkPermissionFromDB(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    try {
      // Get user with all their permissions from various sources using raw SQL
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

      // Check role-based permissions
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
   * OPTIMIZED: Check permission by name with memory + Redis cache
   */
  async hasPermissionByName(
    userId: string,
    permissionName: string,
  ): Promise<boolean> {
    const cacheKey = `rbac:${userId}:name:${permissionName}`;

    try {
      // 1. Check in-memory cache first
      const memoryResult = this.getFromMemoryCache<boolean>(cacheKey);
      if (memoryResult !== null) {
        return memoryResult;
      }

      // 2. Check Redis cache
      // const cachedResult = await this.redisService.get(cacheKey);
      // if (cachedResult !== null) {
      //   const result = cachedResult === 'true';
      //   this.setMemoryCache(cacheKey, result);
      //   return result;
      // }

      // 3. Database lookup
      const result = await this.checkPermissionByNameFromDB(
        userId,
        permissionName,
      );

      // 4. Cache the result
      this.setMemoryCache(cacheKey, result);
      // try {
      //   await this.redisService.setex(cacheKey, this.REDIS_CACHE_TTL, result.toString());
      // } catch (cacheError) {
      //   this.logger.warn('[RBAC] Failed to cache permission by name:', cacheError.message);
      // }

      return result;
    } catch (redisError) {
      this.logger.warn(
        '[RBAC] Redis error in hasPermissionByName:',
        redisError.message,
      );
      return this.checkPermissionByNameFromDB(userId, permissionName);
    }
  }

  /**
   * Internal method to check permission by name from database
   */
  private async checkPermissionByNameFromDB(
    userId: string,
    permissionName: string,
  ): Promise<boolean> {
    try {
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
   * Get all permissions for a user (optimized with caching)
   */
  async getUserPermissions(userId: string) {
    const cacheKey = `rbac:${userId}:all_permissions`;

    try {
      // Check memory cache first
      const memoryResult = this.getFromMemoryCache<any[]>(cacheKey);
      if (memoryResult !== null) {
        return memoryResult;
      }

      // Check Redis cache
      // const cachedResult = await this.redisService.get(cacheKey);
      // if (cachedResult) {
      //   const result = JSON.parse(cachedResult);
      //   this.setMemoryCache(cacheKey, result);
      //   return result;
      // }

      // Database lookup
      const result = await this.getUserPermissionsFromDB(userId);

      // Cache the result
      this.setMemoryCache(cacheKey, result);

      // try {
      //   await this.redisService.setex(cacheKey, this.REDIS_CACHE_TTL, JSON.stringify(result));
      // } catch (cacheError) {
      //   this.logger.warn('[RBAC] Failed to cache user permissions:', cacheError.message);
      // }

      return result;
    } catch (redisError) {
      this.logger.warn(
        '[RBAC] Redis error in getUserPermissions:',
        redisError.message,
      );
      return this.getUserPermissionsFromDB(userId);
    }
  }

  /**
   * Get user permissions from database
   */
  private async getUserPermissionsFromDB(userId: string) {
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
               ) as role_permissions
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

      return allPermissions;
    } catch (error) {
      this.logger.error(
        `Error getting user permissions from DB: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Clear all user caches (memory + Redis)
   */
  async clearAllUserCaches(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear Redis cache with pattern matching (updated for Admin/User system)
      // const patterns = ['rbac:*', 'admin:*'];

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

      this.logger.log('All RBAC caches cleared successfully (memory + Redis)');
    } catch (error) {
      this.logger.error('Error clearing all RBAC caches:', error);
    }
  }

  /**
   * Warm up cache for a user with common permissions
   */
  async warmUpUserCache(
    userId: string,
    commonPermissions: Array<{ resource: string; action: string }>,
  ): Promise<void> {
    try {
      // Pre-load common permissions into cache
      await Promise.all(
        commonPermissions.map(({ resource, action }) =>
          this.hasPermission(userId, resource, action),
        ),
      );

      // Pre-load user permissions
      await this.getUserPermissions(userId);

      this.logger.debug(
        `Warmed up cache for user ${userId} with ${commonPermissions.length} permissions`,
      );
    } catch (error) {
      this.logger.warn(
        `Error warming up cache for user ${userId}:`,
        error.message,
      );
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { memory: number; memorySize: string } {
    const memorySize = JSON.stringify([...this.memoryCache.entries()]).length;
    return {
      memory: this.memoryCache.size,
      memorySize: `${Math.round(memorySize / 1024)}KB`,
    };
  }
}
