
-- Description: Seed default roles and assign permissions

-- Insert default system roles
INSERT INTO roles (name, display_name, description, is_system, priority) VALUES
('SUPER_ADMIN', 'Super Administrator', 'Full system access with all permissions', true, 100),
('ADMIN', 'Administrator', 'Administrative access with most permissions', true, 90),
('MANAGER', 'Manager', 'Management access with limited administrative permissions', true, 70),
('USER', 'User', 'Basic user access', true, 10)
ON CONFLICT (name, tenant_id) DO NOTHING;

-- Assign permissions to SUPER_ADMIN (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN' AND r.tenant_id IS NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND r.tenant_id IS NULL
AND p.name IN (
    'users:manage',
    'roles:manage',
    'permissions:read',
    'permissions:list',
    'tenants:manage',
    'settings:manage',
    'reports:manage',
    'audit_logs:read',
    'audit_logs:list'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'MANAGER' AND r.tenant_id IS NULL
AND p.name IN (
    'users:create',
    'users:read',
    'users:update',
    'users:list',
    'roles:read',
    'roles:list',
    'roles:assign',
    'permissions:read',
    'permissions:list',
    'reports:read',
    'reports:create'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to USER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'USER' AND r.tenant_id IS NULL
AND p.name IN (
    'profile:read',
    'profile:update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;