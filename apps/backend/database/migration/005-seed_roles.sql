
-- Description: Seed default roles and assign permissions
-- NOTE: This migration is commented out because we now create tenant-specific roles during signup
-- instead of global system roles. This ensures true SaaS isolation.

/*
-- Insert default system roles
INSERT INTO roles (name, description, is_system) VALUES
('Super Administrator', 'Full system access with all permissions', true),
('Administrator', 'Administrative access with most permissions', true),
('User Admin', 'User management access with limited permissions', true)
ON CONFLICT (name, tenant_id) DO NOTHING;

-- Assign ALL permissions to Super Administrator
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Super Administrator' AND r.tenant_id IS NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign most permissions to Administrator (excluding some sensitive ones)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrator' AND r.tenant_id IS NULL
AND p.name NOT IN (
    'permissions:manage',  -- Can't manage permissions
    'roles:manage',        -- Can't manage roles
    'tenants:manage',      -- Can't manage tenants
    'settings:manage'      -- Can't manage system settings
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign basic read permissions to User Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'User Admin' AND r.tenant_id IS NULL
AND p.name IN (
    'users:read',
    'users:list',
    'users:create',
    'users:update',
    'roles:read',
    'roles:list',
    'permissions:read',
    'permissions:list',
    'profile:read',
    'profile:update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
*/