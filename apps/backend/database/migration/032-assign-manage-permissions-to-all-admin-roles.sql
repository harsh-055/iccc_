-- Description: Assign manage module permissions to ALL Admin roles across all tenants

-- =====================================================
-- ASSIGN MANAGE MODULE PERMISSIONS TO ALL ADMIN ROLES
-- =====================================================

-- Assign manage module permissions to ALL Admin roles across all tenants
DO $$
DECLARE
    admin_role RECORD;
    permission_record RECORD;
    assigned_count INTEGER := 0;
BEGIN
    -- Loop through ALL Admin roles
    FOR admin_role IN 
        SELECT id, name, tenant_id FROM roles WHERE name = 'Admin'
    LOOP
        -- For each Admin role, assign all manage module permissions
        FOR permission_record IN 
            SELECT id FROM permissions 
            WHERE name LIKE 'manage:%'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id, assigned_at)
            VALUES (admin_role.id, permission_record.id, CURRENT_TIMESTAMP)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
            
            assigned_count := assigned_count + 1;
        END LOOP;
        
        RAISE NOTICE 'Assigned manage permissions to Admin role % for tenant %', 
            admin_role.id, admin_role.tenant_id;
    END LOOP;
    
    RAISE NOTICE 'Successfully assigned manage module permissions to ALL Admin roles. Total assignments: %', assigned_count;
END $$; 