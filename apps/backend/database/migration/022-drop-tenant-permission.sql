-- Drop tenant_id column from permissions table
ALTER TABLE permissions DROP COLUMN IF EXISTS tenant_id;

-- Drop tenant_id column from user_permissions table  
ALTER TABLE user_permissions DROP COLUMN IF EXISTS tenant_id;

-- Drop related constraints and indexes
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS fk_permissions_tenant_id;
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS unique_permission_per_tenant;
DROP INDEX IF EXISTS idx_permissions_tenant_id;
DROP INDEX IF EXISTS idx_permissions_system;

-- Update unique constraint on user_permissions to remove tenant_id
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_user_id_permission_id_tenant_id_key;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_permissions_user_id_permission_id_key' 
        AND table_name = 'user_permissions'
    ) THEN
        ALTER TABLE user_permissions ADD CONSTRAINT user_permissions_user_id_permission_id_key UNIQUE (user_id, permission_id);
    END IF;
END $$;

-- Update unique constraint on permissions to be resource + action only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_permission_resource_action' 
        AND table_name = 'permissions'
    ) THEN
        ALTER TABLE permissions ADD CONSTRAINT unique_permission_resource_action UNIQUE (resource, action);
    END IF;
END $$;