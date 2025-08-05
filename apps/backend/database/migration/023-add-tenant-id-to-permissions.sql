-- Add tenant_id column back to permissions table for hybrid approach
-- This allows both global permissions (tenant_id IS NULL) and tenant-specific permissions

ALTER TABLE permissions 
ADD COLUMN tenant_id UUID NULL;

-- Add foreign key constraint to tenants table
ALTER TABLE permissions 
ADD CONSTRAINT fk_permissions_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) 
ON DELETE CASCADE;

-- Add composite unique constraint for resource + action + tenant_id
-- This ensures no duplicate permissions per tenant, but allows global permissions
ALTER TABLE permissions 
ADD CONSTRAINT unique_permission_per_tenant 
UNIQUE (resource, action, tenant_id);

-- Add index for performance on tenant_id queries
CREATE INDEX idx_permissions_tenant_id ON permissions(tenant_id);

-- Add partial index for global permissions (where tenant_id IS NULL)
CREATE INDEX idx_permissions_global ON permissions(tenant_id) WHERE tenant_id IS NULL;

-- Add partial index for tenant-specific permissions
CREATE INDEX idx_permissions_tenant_specific ON permissions(tenant_id) WHERE tenant_id IS NOT NULL;

-- Update existing permissions to be global (tenant_id IS NULL)
-- This makes all existing permissions global by default
UPDATE permissions SET tenant_id = NULL WHERE tenant_id IS NULL;

-- Add comment to explain the hybrid approach
COMMENT ON COLUMN permissions.tenant_id IS 'NULL for global permissions, UUID for tenant-specific permissions'; 