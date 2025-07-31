

-- Insert default permissions
INSERT INTO permissions (name, display_name, description, resource, action, is_system) VALUES
-- User permissions
('users:create', 'Create Users', 'Create new users', 'users', 'create', true),
('users:read', 'View Users', 'View user details', 'users', 'read', true),
('users:update', 'Update Users', 'Update user information', 'users', 'update', true),
('users:delete', 'Delete Users', 'Delete users', 'users', 'delete', true),
('users:list', 'List Users', 'View all users', 'users', 'list', true),
('users:manage', 'Manage Users', 'Full user management access', 'users', 'manage', true),

-- Role permissions
('roles:create', 'Create Roles', 'Create new roles', 'roles', 'create', true),
('roles:read', 'View Roles', 'View role details', 'roles', 'read', true),
('roles:update', 'Update Roles', 'Update role information', 'roles', 'update', true),
('roles:delete', 'Delete Roles', 'Delete roles', 'roles', 'delete', true),
('roles:list', 'List Roles', 'View all roles', 'roles', 'list', true),
('roles:assign', 'Assign Roles', 'Assign roles to users', 'roles', 'assign', true),
('roles:revoke', 'Revoke Roles', 'Revoke roles from users', 'roles', 'revoke', true),
('roles:manage', 'Manage Roles', 'Full role management access', 'roles', 'manage', true),

-- Permission permissions
('permissions:read', 'View Permissions', 'View permission details', 'permissions', 'read', true),
('permissions:list', 'List Permissions', 'View all permissions', 'permissions', 'list', true),
('permissions:assign', 'Assign Permissions', 'Assign permissions to roles', 'permissions', 'assign', true),
('permissions:revoke', 'Revoke Permissions', 'Revoke permissions from roles', 'permissions', 'revoke', true),
('permissions:manage', 'Manage Permissions', 'Full permission management access', 'permissions', 'manage', true),

-- Tenant permissions
('tenants:create', 'Create Tenants', 'Create new tenants', 'tenants', 'create', true),
('tenants:read', 'View Tenants', 'View tenant details', 'tenants', 'read', true),
('tenants:update', 'Update Tenants', 'Update tenant information', 'tenants', 'update', true),
('tenants:delete', 'Delete Tenants', 'Delete tenants', 'tenants', 'delete', true),
('tenants:list', 'List Tenants', 'View all tenants', 'tenants', 'list', true),
('tenants:manage', 'Manage Tenants', 'Full tenant management access', 'tenants', 'manage', true),

-- Profile permissions (self-management)
('profile:read', 'View Own Profile', 'View own profile', 'profile', 'read', true),
('profile:update', 'Update Own Profile', 'Update own profile', 'profile', 'update', true),

-- Settings permissions
('settings:read', 'View Settings', 'View system settings', 'settings', 'read', true),
('settings:update', 'Update Settings', 'Update system settings', 'settings', 'update', true),
('settings:manage', 'Manage Settings', 'Full settings access', 'settings', 'manage', true),

-- Reports permissions
('reports:read', 'View Reports', 'View reports', 'reports', 'read', true),
('reports:create', 'Create Reports', 'Create new reports', 'reports', 'create', true),
('reports:manage', 'Manage Reports', 'Full reports access', 'reports', 'manage', true),

-- Audit logs permissions
('audit_logs:read', 'View Audit Logs', 'View audit logs', 'audit_logs', 'read', true),
('audit_logs:list', 'List Audit Logs', 'List all audit logs', 'audit_logs', 'list', true)

ON CONFLICT (name) DO NOTHING;