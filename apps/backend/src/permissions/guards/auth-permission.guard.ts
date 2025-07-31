import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../../localauth/localauth.guard';
import { PermissionGuard } from './permission.guard';
import { AuthHelper } from '../../localauth/utils/auth.helper';
import { DatabaseService } from '../../../database/database.service';
import { RbacService } from '../../rbac/rbac.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorators';

@Injectable()
export class AuthPermissionGuard implements CanActivate {
  private authGuard: AuthGuard;
  private permissionGuard: PermissionGuard;

  constructor(
    private authHelper: AuthHelper,
    private reflector: Reflector,
    private database: DatabaseService,
    private rbacService: RbacService
  ) {
    this.authGuard = new AuthGuard(this.authHelper);
    this.permissionGuard = new PermissionGuard(this.reflector, this.database, this.rbacService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If the route is public, allow access without authentication
    if (isPublic) {
      return true;
    }

    // First check if the user is authenticated
    const isAuthenticated = await this.authGuard.canActivate(context);
    
    if (!isAuthenticated) {
      return false;
    }
    
    // Then check if the user has the required permissions
    return this.permissionGuard.canActivate(context);
  }
}