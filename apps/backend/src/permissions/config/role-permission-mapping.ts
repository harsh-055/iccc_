import { PREDEFINED_PERMISSIONS } from './predefined-permissions';

export interface RolePermissionMapping {
  roleName: string;
  permissionNames: string[];
  description: string;
}

export const ROLE_PERMISSION_MAPPINGS: RolePermissionMapping[] = [
  {
    roleName: 'Super Administrator',
    permissionNames: [
      // All permissions in resource:action format
      'users:manage', 'users:read', 'users:list', 'users:create', 'users:update', 'users:delete',
      'roles:manage', 'roles:read', 'roles:list', 'roles:create', 'roles:update', 'roles:delete', 'roles:assign',
      'permissions:manage', 'permissions:read', 'permissions:list', 'permissions:create', 'permissions:update', 'permissions:delete', 'permissions:assign',
      'tenants:manage', 'tenants:read', 'tenants:list',
      'system:manage', 'system:access',
      'api:manage',
      'regions:manage', 'regions:read', 'regions:list', 'regions:create', 'regions:update', 'regions:delete',
      'zones:manage', 'zones:read', 'zones:list', 'zones:create', 'zones:update', 'zones:delete',
      'wards:manage', 'wards:read', 'wards:list', 'wards:create', 'wards:update', 'wards:delete',
      'sites:manage', 'sites:read', 'sites:list', 'sites:create', 'sites:update', 'sites:delete',
      'vehicles:manage', 'vehicles:read', 'vehicles:list', 'vehicles:create', 'vehicles:update', 'vehicles:delete',
      'devices:manage', 'devices:read', 'devices:list', 'devices:create', 'devices:update', 'devices:delete',
      'inventory:manage', 'inventory:read', 'inventory:list', 'inventory:create', 'inventory:update', 'inventory:delete',
      'workforce:manage', 'workforce:read', 'workforce:list', 'workforce:create', 'workforce:update', 'workforce:delete',
      'visitors:manage', 'visitors:read', 'visitors:list', 'visitors:create', 'visitors:update', 'visitors:delete',
      'entry_requests:manage', 'entry_requests:read', 'entry_requests:list', 'entry_requests:create', 'entry_requests:approve',
      'visitor_logs:manage', 'visitor_logs:read', 'visitor_logs:list', 'visitor_logs:create', 'visitor_logs:export',
      'visitor_dashboard:read', 'visitor_analytics:read',
      'entry_gates:manage', 'entry_gates:read', 'entry_gates:list',
      'qr_codes:validate', 'qr_codes:generate',
      'dashboard:read', 'dashboard:export', 'dashboard:customize',
      'profile:read', 'profile:update', 'profile:change_password', 'profile:settings', 'profile:activity'
    ],
    description: 'Full system access with all permissions'
  },
  {
    roleName: 'Administrator', 
    permissionNames: [
      // Most permissions except sensitive system ones
      'users:manage', 'users:read', 'users:list', 'users:create', 'users:update', 'users:delete',
      'roles:read', 'roles:list', 'roles:assign',
      'permissions:read', 'permissions:list',
      'tenants:read', 'tenants:list',
      'system:access',
      'regions:manage', 'regions:read', 'regions:list', 'regions:create', 'regions:update', 'regions:delete',
      'zones:manage', 'zones:read', 'zones:list', 'zones:create', 'zones:update', 'zones:delete',
      'wards:manage', 'wards:read', 'wards:list', 'wards:create', 'wards:update', 'wards:delete',
      'sites:manage', 'sites:read', 'sites:list', 'sites:create', 'sites:update', 'sites:delete',
      'vehicles:manage', 'vehicles:read', 'vehicles:list', 'vehicles:create', 'vehicles:update', 'vehicles:delete',
      'devices:manage', 'devices:read', 'devices:list', 'devices:create', 'devices:update', 'devices:delete',
      'inventory:manage', 'inventory:read', 'inventory:list', 'inventory:create', 'inventory:update', 'inventory:delete',
      'workforce:manage', 'workforce:read', 'workforce:list', 'workforce:create', 'workforce:update', 'workforce:delete',
      'visitors:manage', 'visitors:read', 'visitors:list', 'visitors:create', 'visitors:update', 'visitors:delete',
      'entry_requests:manage', 'entry_requests:read', 'entry_requests:list', 'entry_requests:create', 'entry_requests:approve',
      'visitor_logs:manage', 'visitor_logs:read', 'visitor_logs:list', 'visitor_logs:create', 'visitor_logs:export',
      'visitor_dashboard:read', 'visitor_analytics:read',
      'entry_gates:manage', 'entry_gates:read', 'entry_gates:list',
      'qr_codes:validate', 'qr_codes:generate',
      'dashboard:read', 'dashboard:export', 'dashboard:customize',
      'profile:read', 'profile:update', 'profile:change_password', 'profile:settings', 'profile:activity'
    ],
    description: 'Administrative access with most permissions'
  },
  {
    roleName: 'User Admin',
    permissionNames: [
      // Limited permissions for user management
      'users:read', 'users:list',
      'roles:read', 'roles:list',
      'permissions:read',
      'profile:read', 'profile:update', 'profile:change_password', 'profile:settings', 'profile:activity',
      'dashboard:read'
    ],
    description: 'User management access with limited permissions'
  }
];

// Helper function to get permissions for a specific role
export function getPermissionsForRole(roleName: string): string[] {
  const mapping = ROLE_PERMISSION_MAPPINGS.find(m => m.roleName === roleName);
  return mapping ? mapping.permissionNames : [];
}

// Helper function to get all role names
export function getAllRoleNames(): string[] {
  return ROLE_PERMISSION_MAPPINGS.map(m => m.roleName);
}

// Helper function to validate if a permission exists
export function validatePermission(permissionName: string): boolean {
  return PREDEFINED_PERMISSIONS.some(p => p.name === permissionName);
} 