-- Description: Add dashboard module permissions with auto-assignment to Admin roles

-- =====================================================
-- ADD DASHBOARD PERMISSIONS
-- =====================================================

-- Add dashboard permissions
INSERT INTO permissions (id, name, resource, action, description, created_at, updated_at) VALUES
(uuid_generate_v4(), 'READ_DASHBOARD', 'dashboard', 'read', 'Can view dashboard and statistics', NOW(), NOW()),
(uuid_generate_v4(), 'EXPORT_DASHBOARD', 'dashboard', 'export', 'Can export dashboard data', NOW(), NOW()),
(uuid_generate_v4(), 'CUSTOMIZE_DASHBOARD', 'dashboard', 'customize', 'Can customize dashboard layout', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- CREATE FUNCTION TO AUTO-ASSIGN DASHBOARD PERMISSIONS TO ADMIN ROLES
-- =====================================================

-- Function to automatically assign dashboard permissions to Admin roles
CREATE OR REPLACE FUNCTION assign_dashboard_permissions_to_admin_role(admin_role_id UUID)
RETURNS VOID AS $$
DECLARE
    permission_record RECORD;
BEGIN
    -- Assign all dashboard permissions to the Admin role
    FOR permission_record IN 
        SELECT p.id 
        FROM permissions p 
        WHERE p.name IN ('READ_DASHBOARD', 'EXPORT_DASHBOARD', 'CUSTOMIZE_DASHBOARD')
        AND NOT EXISTS (
            SELECT 1 FROM role_permissions rp 
            WHERE rp.role_id = admin_role_id 
            AND rp.permission_id = p.id
        )
    LOOP
        INSERT INTO role_permissions (role_id, permission_id, assigned_at)
        VALUES (admin_role_id, permission_record.id, CURRENT_TIMESTAMP)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ASSIGN DASHBOARD PERMISSIONS TO EXISTING ADMIN ROLES
-- =====================================================

DO $$
DECLARE
    admin_role RECORD;
BEGIN
    -- Loop through ALL existing Admin roles and assign dashboard permissions
    FOR admin_role IN 
        SELECT id, name, tenant_id FROM roles WHERE name = 'Admin'
    LOOP
        PERFORM assign_dashboard_permissions_to_admin_role(admin_role.id);
        RAISE NOTICE 'Assigned dashboard permissions to existing Admin role % for tenant %', 
            admin_role.id, admin_role.tenant_id;
    END LOOP;
END $$;

-- =====================================================
-- ASSIGN BASIC READ_DASHBOARD PERMISSION TO ALL EXISTING ROLES
-- =====================================================

DO $$
DECLARE
    role_record RECORD;
    dashboard_read_permission_id UUID;
BEGIN
    -- Get the READ_DASHBOARD permission ID
    SELECT id INTO dashboard_read_permission_id 
    FROM permissions 
    WHERE name = 'READ_DASHBOARD';
    
    -- Assign READ_DASHBOARD permission to all existing active roles
    FOR role_record IN 
        SELECT id, name, tenant_id FROM roles WHERE is_active = true
    LOOP
        INSERT INTO role_permissions (role_id, permission_id, assigned_at)
        VALUES (role_record.id, dashboard_read_permission_id, CURRENT_TIMESTAMP)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
        
        RAISE NOTICE 'Assigned READ_DASHBOARD permission to role % (%s) for tenant %', 
            role_record.id, role_record.name, role_record.tenant_id;
    END LOOP;
END $$;

-- =====================================================
-- UPDATE EXISTING TRIGGER TO INCLUDE DASHBOARD PERMISSIONS
-- =====================================================

-- Update the existing function to also assign dashboard permissions
CREATE OR REPLACE FUNCTION auto_assign_admin_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new Admin role, automatically assign manage and dashboard permissions
    IF NEW.name = 'Admin' THEN
        -- Assign manage permissions
        PERFORM assign_manage_permissions_to_admin_role(NEW.id);
        -- Assign dashboard permissions
        PERFORM assign_dashboard_permissions_to_admin_role(NEW.id);
        RAISE NOTICE 'Auto-assigned manage and dashboard permissions to new Admin role %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify that all Admin roles have dashboard permissions
DO $$
DECLARE
    admin_role RECORD;
    permission_count INTEGER;
BEGIN
    FOR admin_role IN 
        SELECT id, name, tenant_id FROM roles WHERE name = 'Admin'
    LOOP
        SELECT COUNT(*) INTO permission_count
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = admin_role.id AND p.name IN ('READ_DASHBOARD', 'EXPORT_DASHBOARD', 'CUSTOMIZE_DASHBOARD');
        
        RAISE NOTICE 'Admin role % (tenant %) has % dashboard permissions', 
            admin_role.id, admin_role.tenant_id, permission_count;
    END LOOP;
END $$; 