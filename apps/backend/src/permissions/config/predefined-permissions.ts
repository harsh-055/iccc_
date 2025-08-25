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
    name: 'users:manage',
    resource: 'users',
    action: 'manage',
    description: 'Full user management - create, read, update, delete users',
    module: 'User Management',
    userType: 'ADMIN',
  },
  {
    name: 'users:read',
    resource: 'users',
    action: 'read',
    description: 'Read user information',
    module: 'User Management',
    userType: 'ADMIN',
  },
  {
    name: 'users:list',
    resource: 'users',
    action: 'list',
    description: 'List all users',
    module: 'User Management',
    userType: 'ADMIN',
  },
  {
    name: 'users:create',
    resource: 'users',
    action: 'create',
    description: 'Create new users',
    module: 'User Management',
    userType: 'ADMIN',
  },
  {
    name: 'users:update',
    resource: 'users',
    action: 'update',
    description: 'Update user information',
    module: 'User Management',
    userType: 'ADMIN',
  },
  {
    name: 'users:delete',
    resource: 'users',
    action: 'delete',
    description: 'Delete users',
    module: 'User Management',
    userType: 'ADMIN',
  },

  // Role Management - Admin Only
  {
    name: 'roles:manage',
    resource: 'roles',
    action: 'manage',
    description: 'Full role management - create, read, update, delete roles',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'roles:read',
    resource: 'roles',
    action: 'read',
    description: 'Read role information',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'roles:list',
    resource: 'roles',
    action: 'list',
    description: 'List all roles',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'roles:create',
    resource: 'roles',
    action: 'create',
    description: 'Create new roles',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'roles:update',
    resource: 'roles',
    action: 'update',
    description: 'Update existing roles',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'roles:delete',
    resource: 'roles',
    action: 'delete',
    description: 'Delete roles',
    module: 'Role Management',
    userType: 'ADMIN',
  },
  {
    name: 'roles:assign',
    resource: 'roles',
    action: 'assign',
    description: 'Assign roles to users',
    module: 'Role Management',
    userType: 'ADMIN',
  },

  // Permission Management - Admin Only
  {
    name: 'permissions:manage',
    resource: 'permissions',
    action: 'manage',
    description: 'Full permission management - create, read, update, delete permissions',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'permissions:read',
    resource: 'permissions',
    action: 'read',
    description: 'Read permission information',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'permissions:list',
    resource: 'permissions',
    action: 'list',
    description: 'List all permissions',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'permissions:create',
    resource: 'permissions',
    action: 'create',
    description: 'Create new permissions',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'permissions:update',
    resource: 'permissions',
    action: 'update',
    description: 'Update existing permissions',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'permissions:delete',
    resource: 'permissions',
    action: 'delete',
    description: 'Delete permissions',
    module: 'Permission Management',
    userType: 'ADMIN',
  },
  {
    name: 'permissions:assign',
    resource: 'permissions',
    action: 'assign',
    description: 'Assign permissions to roles',
    module: 'Permission Management',
    userType: 'ADMIN',
  },

  // Tenant Management - Admin Only
  {
    name: 'tenants:manage',
    resource: 'tenants',
    action: 'manage',
    description: 'Full tenant management - create, read, update, delete tenants',
    module: 'Tenant Management',
    userType: 'ADMIN',
  },
  {
    name: 'tenants:read',
    resource: 'tenants',
    action: 'read',
    description: 'Read tenant information',
    module: 'Tenant Management',
    userType: 'ADMIN',
  },
  {
    name: 'tenants:list',
    resource: 'tenants',
    action: 'list',
    description: 'List all tenants',
    module: 'Tenant Management',
    userType: 'ADMIN',
  },

  // System Management - Admin Only
  {
    name: 'system:manage',
    resource: 'system',
    action: 'manage',
    description: 'Full system configuration management',
    module: 'System Management',
    userType: 'ADMIN',
  },

  // API Management - Admin Only
  {
    name: 'api:manage',
    resource: 'api',
    action: 'manage',
    description: 'Manage API access and configuration',
    module: 'API Management',
    userType: 'ADMIN',
  },

  // 🏢 MANAGE MODULE PERMISSIONS

  // Regions
  {
    name: 'regions:manage',
    resource: 'regions',
    action: 'manage',
    description: 'Full region management',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'regions:read',
    resource: 'regions',
    action: 'read',
    description: 'Read region information',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'regions:list',
    resource: 'regions',
    action: 'list',
    description: 'List all regions',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'regions:create',
    resource: 'regions',
    action: 'create',
    description: 'Create new regions',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'regions:update',
    resource: 'regions',
    action: 'update',
    description: 'Update existing regions',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'regions:delete',
    resource: 'regions',
    action: 'delete',
    description: 'Delete regions',
    module: 'Manage Module',
    userType: 'ADMIN',
  },

  // Zones
  {
    name: 'zones:manage',
    resource: 'zones',
    action: 'manage',
    description: 'Full zone management',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'zones:read',
    resource: 'zones',
    action: 'read',
    description: 'Read zone information',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'zones:list',
    resource: 'zones',
    action: 'list',
    description: 'List all zones',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'zones:create',
    resource: 'zones',
    action: 'create',
    description: 'Create new zones',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'zones:update',
    resource: 'zones',
    action: 'update',
    description: 'Update existing zones',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'zones:delete',
    resource: 'zones',
    action: 'delete',
    description: 'Delete zones',
    module: 'Manage Module',
    userType: 'ADMIN',
  },

  // Wards
  {
    name: 'wards:manage',
    resource: 'wards',
    action: 'manage',
    description: 'Full ward management',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'wards:read',
    resource: 'wards',
    action: 'read',
    description: 'Read ward information',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'wards:list',
    resource: 'wards',
    action: 'list',
    description: 'List all wards',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'wards:create',
    resource: 'wards',
    action: 'create',
    description: 'Create new wards',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'wards:update',
    resource: 'wards',
    action: 'update',
    description: 'Update existing wards',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'wards:delete',
    resource: 'wards',
    action: 'delete',
    description: 'Delete wards',
    module: 'Manage Module',
    userType: 'ADMIN',
  },

  // Sites
  {
    name: 'sites:manage',
    resource: 'sites',
    action: 'manage',
    description: 'Full site management',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'sites:read',
    resource: 'sites',
    action: 'read',
    description: 'Read site information',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'sites:list',
    resource: 'sites',
    action: 'list',
    description: 'List all sites',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'sites:create',
    resource: 'sites',
    action: 'create',
    description: 'Create new sites',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'sites:update',
    resource: 'sites',
    action: 'update',
    description: 'Update existing sites',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'sites:delete',
    resource: 'sites',
    action: 'delete',
    description: 'Delete sites',
    module: 'Manage Module',
    userType: 'ADMIN',
  },

  // Vehicles
  {
    name: 'vehicles:manage',
    resource: 'vehicles',
    action: 'manage',
    description: 'Full vehicle management',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'vehicles:read',
    resource: 'vehicles',
    action: 'read',
    description: 'Read vehicle information',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'vehicles:list',
    resource: 'vehicles',
    action: 'list',
    description: 'List all vehicles',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'vehicles:create',
    resource: 'vehicles',
    action: 'create',
    description: 'Create new vehicles',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'vehicles:update',
    resource: 'vehicles',
    action: 'update',
    description: 'Update existing vehicles',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'vehicles:delete',
    resource: 'vehicles',
    action: 'delete',
    description: 'Delete vehicles',
    module: 'Manage Module',
    userType: 'ADMIN',
  },

  // Devices
  {
    name: 'devices:manage',
    resource: 'devices',
    action: 'manage',
    description: 'Full device management',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'devices:read',
    resource: 'devices',
    action: 'read',
    description: 'Read device information',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'devices:list',
    resource: 'devices',
    action: 'list',
    description: 'List all devices',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'devices:create',
    resource: 'devices',
    action: 'create',
    description: 'Create new devices',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'devices:update',
    resource: 'devices',
    action: 'update',
    description: 'Update existing devices',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'devices:delete',
    resource: 'devices',
    action: 'delete',
    description: 'Delete devices',
    module: 'Manage Module',
    userType: 'ADMIN',
  },

  // Inventory
  {
    name: 'inventory:manage',
    resource: 'inventory',
    action: 'manage',
    description: 'Full inventory management',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'inventory:read',
    resource: 'inventory',
    action: 'read',
    description: 'Read inventory information',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'inventory:list',
    resource: 'inventory',
    action: 'list',
    description: 'List all inventory items',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'inventory:create',
    resource: 'inventory',
    action: 'create',
    description: 'Create new inventory items',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'inventory:update',
    resource: 'inventory',
    action: 'update',
    description: 'Update existing inventory items',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'inventory:delete',
    resource: 'inventory',
    action: 'delete',
    description: 'Delete inventory items',
    module: 'Manage Module',
    userType: 'ADMIN',
  },

  // Workforce
  {
    name: 'workforce:manage',
    resource: 'workforce',
    action: 'manage',
    description: 'Full workforce management',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'workforce:read',
    resource: 'workforce',
    action: 'read',
    description: 'Read workforce information',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'workforce:list',
    resource: 'workforce',
    action: 'list',
    description: 'List all workforce members',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'workforce:create',
    resource: 'workforce',
    action: 'create',
    description: 'Create new workforce members',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'workforce:update',
    resource: 'workforce',
    action: 'update',
    description: 'Update existing workforce members',
    module: 'Manage Module',
    userType: 'ADMIN',
  },
  {
    name: 'workforce:delete',
    resource: 'workforce',
    action: 'delete',
    description: 'Delete workforce members',
    module: 'Manage Module',
    userType: 'ADMIN',
  },

  //// 👤 END USER PERMISSIONS (Limited Self-Service)

  // Self Profile Management
  {
    name: 'profile:read',
    resource: 'profile',
    action: 'read',
    description: 'View own user profile and information',
    module: 'User Management',
    userType: 'END_USER',
  },
  {
    name: 'profile:update',
    resource: 'profile',
    action: 'update',
    description: 'Update own profile information (name, phone, etc.)',
    module: 'User Management',
    userType: 'END_USER',
  },
  {
    name: 'profile:change_password',
    resource: 'profile',
    action: 'change_password',
    description: 'Change own password',
    module: 'User Management',
    userType: 'END_USER',
  },
  {
    name: 'profile:settings',
    resource: 'profile',
    action: 'settings',
    description: 'Update own user preferences and settings',
    module: 'User Management',
    userType: 'END_USER',
  },
  {
    name: 'profile:activity',
    resource: 'profile',
    action: 'activity',
    description: 'View own activity and access history',
    module: 'User Management',
    userType: 'END_USER',
  },

  /// 🔄 SHARED PERMISSIONS (Both Admin and End User)

  // Basic System Access
  {
    name: 'system:access',
    resource: 'system',
    action: 'access',
    description: 'Basic system access and login',
    module: 'System Access',
    userType: 'BOTH',
  },

  // 🏢 VISITOR MANAGEMENT PERMISSIONS

  // Visitor Management
  {
    name: 'visitors:manage',
    resource: 'visitors',
    action: 'manage',
    description: 'Full visitor management - create, read, update, delete visitors',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'visitors:read',
    resource: 'visitors',
    action: 'read',
    description: 'Read visitor information',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'visitors:list',
    resource: 'visitors',
    action: 'list',
    description: 'List all visitors',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'visitors:create',
    resource: 'visitors',
    action: 'create',
    description: 'Create new visitors',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'visitors:update',
    resource: 'visitors',
    action: 'update',
    description: 'Update visitor information',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'visitors:delete',
    resource: 'visitors',
    action: 'delete',
    description: 'Delete visitors (soft delete)',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },

  // Entry Requests
  {
    name: 'entry_requests:manage',
    resource: 'entry_requests',
    action: 'manage',
    description: 'Full entry request management',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'entry_requests:read',
    resource: 'entry_requests',
    action: 'read',
    description: 'Read entry request information',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'entry_requests:list',
    resource: 'entry_requests',
    action: 'list',
    description: 'List all entry requests',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'entry_requests:create',
    resource: 'entry_requests',
    action: 'create',
    description: 'Create entry requests',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'entry_requests:approve',
    resource: 'entry_requests',
    action: 'approve',
    description: 'Approve or reject entry requests',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },

  // Visitor Logs
  {
    name: 'visitor_logs:manage',
    resource: 'visitor_logs',
    action: 'manage',
    description: 'Full visitor log management',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'visitor_logs:read',
    resource: 'visitor_logs',
    action: 'read',
    description: 'Read visitor log information',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'visitor_logs:list',
    resource: 'visitor_logs',
    action: 'list',
    description: 'List all visitor logs',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'visitor_logs:create',
    resource: 'visitor_logs',
    action: 'create',
    description: 'Create visitor logs (entry/exit)',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'visitor_logs:export',
    resource: 'visitor_logs',
    action: 'export',
    description: 'Export visitor log data',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },

  // Visitor Dashboard & Analytics
  {
    name: 'visitor_dashboard:read',
    resource: 'visitor_dashboard',
    action: 'read',
    description: 'View visitor management dashboard',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'visitor_analytics:read',
    resource: 'visitor_analytics',
    action: 'read',
    description: 'View visitor analytics and reports',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },

  // Entry Gates
  {
    name: 'entry_gates:manage',
    resource: 'entry_gates',
    action: 'manage',
    description: 'Manage entry gates',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'entry_gates:read',
    resource: 'entry_gates',
    action: 'read',
    description: 'Read entry gate information',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'entry_gates:list',
    resource: 'entry_gates',
    action: 'list',
    description: 'List all entry gates',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },

  // QR Codes
  {
    name: 'qr_codes:validate',
    resource: 'qr_codes',
    action: 'validate',
    description: 'Validate visitor QR codes',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },
  {
    name: 'qr_codes:generate',
    resource: 'qr_codes',
    action: 'generate',
    description: 'Generate QR codes for visitors',
    module: 'Visitor Management',
    userType: 'ADMIN',
  },

  // 📊 DASHBOARD PERMISSIONS

  // General Dashboard
  {
    name: 'dashboard:read',
    resource: 'dashboard',
    action: 'read',
    description: 'Can view dashboard and statistics',
    module: 'Dashboard',
    userType: 'BOTH',
  },
  {
    name: 'dashboard:export',
    resource: 'dashboard',
    action: 'export',
    description: 'Can export dashboard data',
    module: 'Dashboard',
    userType: 'ADMIN',
  },
  {
    name: 'dashboard:customize',
    resource: 'dashboard',
    action: 'customize',
    description: 'Can customize dashboard layout',
    module: 'Dashboard',
    userType: 'ADMIN',
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
