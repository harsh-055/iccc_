-- Add tenant_id column to permissions table
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS tenant_id UUID NULL;

-- Add foreign key constraint (optional - if you have a tenants table)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_permissions_tenant_id' 
        AND table_name = 'permissions'
    ) THEN
        ALTER TABLE permissions 
        ADD CONSTRAINT fk_permissions_tenant_id 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add composite unique constraint for resource + action + tenant_id
-- This ensures no duplicate permissions per tenant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_permission_per_tenant' 
        AND table_name = 'permissions'
    ) THEN
        ALTER TABLE permissions 
        ADD CONSTRAINT unique_permission_per_tenant 
        UNIQUE (resource, action, tenant_id);
    END IF;
END $$;

-- Add index for performance on tenant_id queries
CREATE INDEX IF NOT EXISTS idx_permissions_tenant_id ON permissions(tenant_id);

-- Add partial index for system-wide permissions (where tenant_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_permissions_system ON permissions(tenant_id) WHERE tenant_id IS NULL;