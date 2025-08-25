-- Description: Assign manage module permissions to Admin roles that don't have them yet

-- =====================================================
-- ASSIGN MANAGE PERMISSIONS TO ADMIN ROLES
-- =====================================================

-- Assign manage module permissions to Admin roles that don't have them yet
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
        -- For each Admin role, assign manage module permissions if missing
        FOR permission_record IN 
            SELECT p.id 
            FROM permissions p 
            WHERE p.name LIKE 'manage:%'
            AND NOT EXISTS (
                SELECT 1 FROM role_permissions rp 
                WHERE rp.role_id = admin_role.id 
                AND rp.permission_id = p.id
            )
        LOOP
            INSERT INTO role_permissions (role_id, permission_id, assigned_at)
            VALUES (admin_role.id, permission_record.id, CURRENT_TIMESTAMP);
            
            assigned_count := assigned_count + 1;
        END LOOP;
        
        RAISE NOTICE 'Assigned manage permissions to Admin role % for tenant %', 
            admin_role.id, admin_role.tenant_id;
    END LOOP;
    
    RAISE NOTICE 'Migration complete. Total new permission assignments: %', assigned_count;
END $$; 