import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 * @param permissions - Array of permission names required to access the route
 */
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions); 