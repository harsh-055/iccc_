

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action, is_system) VALUES
-- User permissions
('users:create', 'Create new users', 'users', 'create', true),
('users:read', 'View user details', 'users', 'read', true),
('users:update', 'Update user information', 'users', 'update', true),
('users:delete', 'Delete users', 'users', 'delete', true),
('users:list', 'View all users', 'users', 'list', true),
('users:manage', 'Full user management access', 'users', 'manage', true),

-- Role permissions
('roles:create', 'Create new roles', 'roles', 'create', true),
('roles:read', 'View role details', 'roles', 'read', true),
('roles:update', 'Update role information', 'roles', 'update', true),
('roles:delete', 'Delete roles', 'roles', 'delete', true),
('roles:list', 'View all roles', 'roles', 'list', true),
('roles:assign', 'Assign roles to users', 'roles', 'assign', true),
('roles:revoke', 'Revoke roles from users', 'roles', 'revoke', true),
('roles:manage', 'Full role management access', 'roles', 'manage', true),

-- Permission permissions
('permissions:read', 'View permission details', 'permissions', 'read', true),
('permissions:list', 'View all permissions', 'permissions', 'list', true),
('permissions:assign', 'Assign permissions to roles', 'permissions', 'assign', true),
('permissions:revoke', 'Revoke permissions from roles', 'permissions', 'revoke', true),
('permissions:manage', 'Full permission management access', 'permissions', 'manage', true),

-- Tenant permissions
('tenants:create', 'Create new tenants', 'tenants', 'create', true),
('tenants:read', 'View tenant details', 'tenants', 'read', true),
('tenants:update', 'Update tenant information', 'tenants', 'update', true),
('tenants:delete', 'Delete tenants', 'tenants', 'delete', true),
('tenants:list', 'View all tenants', 'tenants', 'list', true),
('tenants:manage', 'Full tenant management access', 'tenants', 'manage', true),

-- Profile permissions (self-management)
('profile:read', 'View own profile', 'profile', 'read', true),
('profile:update', 'Update own profile', 'profile', 'update', true),

-- Settings permissions
('settings:read', 'View system settings', 'settings', 'read', true),
('settings:update', 'Update system settings', 'settings', 'update', true),
('settings:manage', 'Full settings access', 'settings', 'manage', true),

-- Reports permissions
('reports:read', 'View reports', 'reports', 'read', true),
('reports:create', 'Create new reports', 'reports', 'create', true),
('reports:manage', 'Full reports access', 'reports', 'manage', true),

-- Audit logs permissions
('audit_logs:read', 'View audit logs', 'audit_logs', 'read', true),
('audit_logs:list', 'List all audit logs', 'audit_logs', 'list', true)

ON CONFLICT (name) DO NOTHING;