-- Description: Migrate users from tenant-admin roles to Admin roles and remove tenant-admin roles

-- =====================================================
-- MIGRATE TENANT-ADMIN TO ADMIN ROLES
-- =====================================================

DO $$
DECLARE
    user_record RECORD;
    admin_role_id UUID;
    tenant_admin_role_id UUID;
    migrated_count INTEGER := 0;
    deleted_count INTEGER := 0;
BEGIN
    -- Loop through all users with tenant-admin roles
    FOR user_record IN 
        SELECT DISTINCT u.id as user_id, u.email, ur.role_id as tenant_admin_role_id, r.tenant_id
        FROM users u 
        JOIN user_roles ur ON u.id = ur.user_id 
        JOIN roles r ON ur.role_id = r.id 
        WHERE r.name = 'tenant-admin'
    LOOP
        -- Find or create Admin role for this tenant
        SELECT id INTO admin_role_id 
        FROM roles 
        WHERE name = 'Admin' AND tenant_id = user_record.tenant_id;
        
        IF admin_role_id IS NULL THEN
            -- Create Admin role for this tenant
            INSERT INTO roles (name, description, tenant_id, is_system, created_at, updated_at)
            VALUES ('Admin', 'Administrator role', user_record.tenant_id, false, NOW(), NOW())
            RETURNING id INTO admin_role_id;
        END IF;
        
        -- Remove user from tenant-admin role
        DELETE FROM user_roles 
        WHERE user_id = user_record.user_id AND role_id = user_record.tenant_admin_role_id;
        
        -- Assign user to Admin role
        INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
        VALUES (user_record.user_id, admin_role_id, user_record.tenant_id, NOW())
        ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;
        
        RAISE NOTICE 'Migrated user % from tenant-admin to Admin role', user_record.email;
        migrated_count := migrated_count + 1;
    END LOOP;
    
    -- Update users who have system_role_id pointing to tenant-admin roles
    UPDATE users 
    SET system_role_id = (
        SELECT r.id 
        FROM roles r 
        WHERE r.name = 'Admin' AND r.tenant_id = users.tenant_id
        LIMIT 1
    )
    WHERE system_role_id IN (
        SELECT id FROM roles WHERE name = 'tenant-admin'
    );
    
    -- Remove all tenant-admin roles
    DELETE FROM roles WHERE name = 'tenant-admin';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Migration complete. Migrated % users, deleted % tenant-admin roles', migrated_count, deleted_count;
END $$; 