import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { DatabaseService } from '../../../database/database.service'
import { RbacService } from '../../rbac/rbac.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private database: DatabaseService,
    private rbacService: RbacService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from route handler metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
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
        console.error(`[PERMISSION_GUARD] Invalid permission name: ${permissionName}`);
        throw new ForbiddenException('Invalid permission format');
      }

      let action: string;
      let resource: string;

      // Handle both colon format (reports:read) and underscore format (READ_REPORTS)
      if (permissionName.includes(':')) {
        [resource, action] = permissionName.toLowerCase().split(':');
      } else if (permissionName.includes('_')) {
        [action, resource] = permissionName.toLowerCase().split('_');
      } else {
        console.error(`[PERMISSION_GUARD] Invalid permission format: ${permissionName}`);
        throw new ForbiddenException('Invalid permission format');
      }

      if (!action || !resource) {
        console.error(`[PERMISSION_GUARD] Invalid permission format: ${permissionName}`);
        throw new ForbiddenException('Invalid permission format');
      }

      const resourcePlural = resource.endsWith('s') ? resource : `${resource}s`;
      
      // 🔒 USE HIERARCHICAL PERMISSION CHECK instead of basic check
      try {
        await this.rbacService.checkHierarchicalPermission(
          user.id, 
          resourcePlural, 
          action
        );
      } catch (error) {
        console.error(`[PERMISSION_GUARD] Hierarchical permission denied for ${user.id}: ${permissionName}`, error.message);
        throw new ForbiddenException(`Access denied: Insufficient permissions for ${permissionName}`);
      }
    }

    return true;
  }
} 