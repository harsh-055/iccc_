export interface PermissionDefinition {
  name: string;
  resource: string;
  action: string;
  description: string;
  module: string;
  userType: 'ADMIN' | 'END_USER' | 'BOTH';
}

export const PREDEFINED_PERMISSIONS: PermissionDefinition[] = [
  // 🔑 ADMIN-ONLY PERMISSIONS (Full System Control)

  // User Management - Admin Only
  {
    name: 'MANAGE_USERS',
    resource: 'users',
    action: 'manage',
    description: 'Full user management - create, read, update, delete users',
    module: 'User Management',
    userType: 'ADMIN',
  },
  {
    name: 'VIEW_ALL_USERS',
    resource: 'users',
    action: 'view_all',
    description: 'View all users in the system',
    module: 'User Management',
    userType: 'ADMIN',
  },
  {
    name: 'RESET_USER_PASSWORD',
    resource: 'users',
    action: 'reset_password',
    description: 'Reset any user password',
    module: 'User Management',
    userType: 'ADMIN',
  },
  {
    name: 'ACTIVATE_DEACTIVATE_USERS',
    resource: 'users',
    action: 'activate_deactivate',
    description: 'Activate or deactivate user accounts',
    module: 'User Management',
    userType: 'ADMIN',
  },

  // Role & Permission Management - Admin Only
  {
    name: 'MANAGE_ROLES',
    resource: 'roles',
    action: 'manage',
    description: 'Full role management - create, read, update, delete roles',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'CREATE_ROLES',
    resource: 'roles',
    action: 'create',
    description: 'Create new roles',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'READ_ROLES',
    resource: 'roles',
    action: 'read',
    description: 'Read and view roles',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'UPDATE_ROLES',
    resource: 'roles',
    action: 'update',
    description: 'Update existing roles',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'DELETE_ROLES',
    resource: 'roles',
    action: 'delete',
    description: 'Delete roles',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'ASSIGN_ROLES',
    resource: 'roles',
    action: 'assign',
    description: 'Assign roles to users',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'MANAGE_PERMISSIONS',
    resource: 'permissions',
    action: 'manage',
    description:
      'Full permission management - create, read, update, delete permissions',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'CREATE_PERMISSION',
    resource: 'permissions',
    action: 'create',
    description: 'Create new permissions',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'READ_PERMISSION',
    resource: 'permissions',
    action: 'read',
    description: 'Read and view permissions',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'UPDATE_PERMISSION',
    resource: 'permissions',
    action: 'update',
    description: 'Update existing permissions',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'DELETE_PERMISSION',
    resource: 'permissions',
    action: 'delete',
    description: 'Delete permissions',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'CREATE_PERMISSIONS',
    resource: 'permissions',
    action: 'create',
    description: 'Create new permissions (plural form)',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'ASSIGN_ROLES_PERMISSIONS',
    resource: 'roles',
    action: 'assign_permissions',
    description: 'Assign permissions to roles and roles to users',
    module: 'Role Management',
    userType: 'ADMIN',
  },

  // Tenant Management - Admin Only
  {
    name: 'MANAGE_TENANTS',
    resource: 'tenants',
    action: 'manage',
    description:
      'Full tenant management - create, read, update, delete tenants',
    module: 'Tenant Management',
    userType: 'ADMIN',
  },
  {
    name: 'MANAGE_TENANT_USERS',
    resource: 'tenants',
    action: 'manage_users',
    description: 'Manage users within tenants - add/remove users from tenants',
    module: 'Tenant Management',
    userType: 'ADMIN',
  },

  // API Management - Admin Only
  {
    name: 'MANAGE_API_ACCESS',
    resource: 'api',
    action: 'manage',
    description: 'Manage API keys, limits, and access',
    module: 'API Management',
    userType: 'ADMIN',
  },
  {
    name: 'MANAGE_SYSTEM_CONFIG',
    resource: 'system',
    action: 'manage_config',
    description: 'Manage system configuration and settings',
    module: 'System Management',
    userType: 'ADMIN',
  },

  //// 👤 END USER PERMISSIONS (Limited Self-Service)

  // Self Profile Management
  {
    name: 'VIEW_OWN_PROFILE',
    resource: 'users',
    action: 'view_own_profile',
    description: 'View own user profile and information',
    module: 'User Management',
    userType: 'END_USER',
  },
  {
    name: 'UPDATE_OWN_PROFILE',
    resource: 'users',
    action: 'update_own_profile',
    description: 'Update own profile information (name, phone, etc.)',
    module: 'User Management',
    userType: 'END_USER',
  },
  {
    name: 'CHANGE_OWN_PASSWORD',
    resource: 'users',
    action: 'change_own_password',
    description: 'Change own password',
    module: 'User Management',
    userType: 'END_USER',
  },
  {
    name: 'UPDATE_OWN_SETTINGS',
    resource: 'users',
    action: 'update_own_settings',
    description: 'Update own user preferences and settings',
    module: 'User Management',
    userType: 'END_USER',
  },
  {
    name: 'VIEW_OWN_ACTIVITY',
    resource: 'users',
    action: 'view_own_activity',
    description: 'View own activity and access history',
    module: 'User Management',
    userType: 'END_USER',
  },

  /// 🔄 SHARED PERMISSIONS (Both Admin and End User)

  // Basic System Access
  {
    name: 'ACCESS_SYSTEM',
    resource: 'system',
    action: 'access',
    description: 'Basic system access and login',
    module: 'System Access',
    userType: 'BOTH',
  },
];

// Helper function to get permissions by module
export function getPermissionsByModule(module: string): PermissionDefinition[] {
  return PREDEFINED_PERMISSIONS.filter(
    (permission) => permission.module === module,
  );
}

// Helper function to get all modules
export function getAllModules(): string[] {
  return [
    ...new Set(PREDEFINED_PERMISSIONS.map((permission) => permission.module)),
  ];
}

// Helper function to get permission by name
export function getPermissionByName(
  name: string,
): PermissionDefinition | undefined {
  return PREDEFINED_PERMISSIONS.find((permission) => permission.name === name);
}
