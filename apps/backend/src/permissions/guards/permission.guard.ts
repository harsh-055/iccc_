import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { DatabaseService } from '../../../database/database.service';
import { RbacService } from '../../rbac/rbac.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private database: DatabaseService,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from route handler metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'];

    // Check if user exists in the request
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check each required permission using HIERARCHICAL permission checks
    for (const permissionName of requiredPermissions) {
      if (!permissionName || typeof permissionName !== 'string') {
        console.error(
          `[PERMISSION_GUARD] Invalid permission name: ${permissionName}`,
        );
        throw new ForbiddenException('Invalid permission format');
      }

      // 🔒 FLEXIBLE PERMISSION CHECK - Check both direct permission and hierarchical permission
      try {
        // First, try to check if the user has the exact permission name
        const hasExactPermission = await this.rbacService.hasPermissionByName(
          user.id,
          permissionName,
        );

        if (hasExactPermission) {
          continue; // User has the exact permission, allow access
        }

        // If exact permission not found, try to parse and check hierarchical permission
        let action: string;
        let resource: string;

        // Handle different permission formats
        if (permissionName.includes(':')) {
          const parts = permissionName.toLowerCase().split(':');
          
          // Handle manage:resource:action format (e.g., manage:regions:read)
          if (parts.length === 3 && parts[0] === 'manage') {
            resource = parts[1];
            action = parts[2];
          } else if (parts.length === 2) {
            // Handle resource:action format (e.g., regions:read)
            [resource, action] = parts;
          } else {
            console.error(
              `[PERMISSION_GUARD] Invalid permission format: ${permissionName}`,
            );
            throw new ForbiddenException('Invalid permission format');
          }
        } else if (permissionName.includes('_')) {
          [action, resource] = permissionName.toLowerCase().split('_');
        } else {
          console.error(
            `[PERMISSION_GUARD] Invalid permission format: ${permissionName}`,
          );
          throw new ForbiddenException('Invalid permission format');
        }

        if (!action || !resource) {
          console.error(
            `[PERMISSION_GUARD] Invalid permission format: ${permissionName}`,
          );
          throw new ForbiddenException('Invalid permission format');
        }

        const resourcePlural = resource.endsWith('s') ? resource : `${resource}s`;

        // Check hierarchical permission
        await this.rbacService.checkHierarchicalPermission(
          user.id,
          resourcePlural,
          action,
        );
      } catch (error) {
        console.error(
          `[PERMISSION_GUARD] Permission denied for ${user.id}: ${permissionName}`,
          error.message,
        );
        throw new ForbiddenException(
          `Access denied: Insufficient permissions for ${permissionName}`,
        );
      }
    }

    return true;
  }
}
