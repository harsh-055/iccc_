-- Description: Ensure all Admin roles (existing and future) get manage permissions automatically

-- =====================================================
-- CREATE FUNCTION TO AUTO-ASSIGN MANAGE PERMISSIONS TO ADMIN ROLES
-- =====================================================

-- Function to automatically assign manage permissions to Admin roles
CREATE OR REPLACE FUNCTION assign_manage_permissions_to_admin_role(admin_role_id UUID)
RETURNS VOID AS $$
DECLARE
    permission_record RECORD;
BEGIN
    -- Assign all manage module permissions to the Admin role
    FOR permission_record IN 
        SELECT p.id 
        FROM permissions p 
        WHERE p.name LIKE 'manage:%'
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
-- ASSIGN PERMISSIONS TO EXISTING ADMIN ROLES
-- =====================================================

DO $$
DECLARE
    admin_role RECORD;
BEGIN
    -- Loop through ALL existing Admin roles and assign manage permissions
    FOR admin_role IN 
        SELECT id, name, tenant_id FROM roles WHERE name = 'Admin'
    LOOP
        PERFORM assign_manage_permissions_to_admin_role(admin_role.id);
        RAISE NOTICE 'Assigned manage permissions to existing Admin role % for tenant %', 
            admin_role.id, admin_role.tenant_id;
    END LOOP;
END $$;

-- =====================================================
-- CREATE TRIGGER FOR FUTURE ADMIN ROLES
-- =====================================================

-- Function to be called by trigger
CREATE OR REPLACE FUNCTION auto_assign_admin_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new Admin role, automatically assign manage permissions
    IF NEW.name = 'Admin' THEN
        PERFORM assign_manage_permissions_to_admin_role(NEW.id);
        RAISE NOTICE 'Auto-assigned manage permissions to new Admin role %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new Admin roles
DROP TRIGGER IF EXISTS auto_assign_admin_permissions_trigger ON roles;
CREATE TRIGGER auto_assign_admin_permissions_trigger
    AFTER INSERT ON roles
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_admin_permissions();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify that all Admin roles have manage permissions
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
        WHERE rp.role_id = admin_role.id AND p.name LIKE 'manage:%';
        
        RAISE NOTICE 'Admin role % (tenant %) has % manage permissions', 
            admin_role.id, admin_role.tenant_id, permission_count;
    END LOOP;
END $$; 