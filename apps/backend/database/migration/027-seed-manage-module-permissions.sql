-- Description: Seed manage module permissions for ICCC waste management system

-- =====================================================
-- MANAGE MODULE PERMISSIONS
-- =====================================================

-- Regions Management Permissions
INSERT INTO permissions (name, resource, action, description, created_at, updated_at) VALUES
('manage:regions:create', 'regions', 'create', 'Create new regions for waste management', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:regions:read', 'regions', 'read', 'View and list regions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:regions:update', 'regions', 'update', 'Update existing regions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:regions:delete', 'regions', 'delete', 'Delete regions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Zones Management Permissions
INSERT INTO permissions (name, resource, action, description, created_at, updated_at) VALUES
('manage:zones:create', 'zones', 'create', 'Create new zones within regions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:zones:read', 'zones', 'read', 'View and list zones', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:zones:update', 'zones', 'update', 'Update existing zones', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:zones:delete', 'zones', 'delete', 'Delete zones', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Wards Management Permissions
INSERT INTO permissions (name, resource, action, description, created_at, updated_at) VALUES
('manage:wards:create', 'wards', 'create', 'Create new wards within zones', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:wards:read', 'wards', 'read', 'View and list wards', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:wards:update', 'wards', 'update', 'Update existing wards', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:wards:delete', 'wards', 'delete', 'Delete wards', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sites Management Permissions
INSERT INTO permissions (name, resource, action, description, created_at, updated_at) VALUES
('manage:sites:create', 'sites', 'create', 'Create new sites (points of interest)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:sites:read', 'sites', 'read', 'View and list sites', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:sites:update', 'sites', 'update', 'Update existing sites', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:sites:delete', 'sites', 'delete', 'Delete sites', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Vehicles Management Permissions
INSERT INTO permissions (name, resource, action, description, created_at, updated_at) VALUES
('manage:vehicles:create', 'vehicles', 'create', 'Create new vehicles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:vehicles:read', 'vehicles', 'read', 'View and list vehicles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:vehicles:update', 'vehicles', 'update', 'Update existing vehicles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:vehicles:delete', 'vehicles', 'delete', 'Delete vehicles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Devices Management Permissions
INSERT INTO permissions (name, resource, action, description, created_at, updated_at) VALUES
('manage:devices:create', 'devices', 'create', 'Create new devices', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:devices:read', 'devices', 'read', 'View and list devices', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:devices:update', 'devices', 'update', 'Update existing devices', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:devices:delete', 'devices', 'delete', 'Delete devices', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Inventory Management Permissions
INSERT INTO permissions (name, resource, action, description, created_at, updated_at) VALUES
('manage:inventory:create', 'inventory', 'create', 'Create new inventory items', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:inventory:read', 'inventory', 'read', 'View and list inventory items', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:inventory:update', 'inventory', 'update', 'Update existing inventory items', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:inventory:delete', 'inventory', 'delete', 'Delete inventory items', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Workforce Management Permissions
INSERT INTO permissions (name, resource, action, description, created_at, updated_at) VALUES
('manage:workforce:create', 'workforce', 'create', 'Create new workforce members', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:workforce:read', 'workforce', 'read', 'View and list workforce members', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:workforce:update', 'workforce', 'update', 'Update existing workforce members', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manage:workforce:delete', 'workforce', 'delete', 'Delete workforce members', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- ASSIGN MANAGE MODULE PERMISSIONS TO SUPER ADMIN ROLE
-- =====================================================

-- Get the Super Admin role ID
DO $$
DECLARE
    super_admin_role_id UUID;
    permission_record RECORD;
BEGIN
    -- Get Super Admin role ID
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Super_Admin' LIMIT 1;
    
    IF super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Super Admin role not found';
    END IF;
    
    -- Assign all manage module permissions to Super Admin role
    FOR permission_record IN 
        SELECT id FROM permissions 
        WHERE name LIKE 'manage:%'
    LOOP
        INSERT INTO role_permissions (role_id, permission_id, assigned_at)
        VALUES (super_admin_role_id, permission_record.id, CURRENT_TIMESTAMP)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Successfully assigned manage module permissions to Super Admin role';
END $$; 