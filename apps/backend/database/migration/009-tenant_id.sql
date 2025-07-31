-- Add tenant_id column to permissions table
ALTER TABLE permissions 
ADD COLUMN tenant_id UUID NULL;

-- Add foreign key constraint (optional - if you have a tenants table)
ALTER TABLE permissions 
ADD CONSTRAINT fk_permissions_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) 
ON DELETE CASCADE;

-- Add composite unique constraint for resource + action + tenant_id
-- This ensures no duplicate permissions per tenant
ALTER TABLE permissions 
ADD CONSTRAINT unique_permission_per_tenant 
UNIQUE (resource, action, tenant_id);

-- Add index for performance on tenant_id queries
CREATE INDEX idx_permissions_tenant_id ON permissions(tenant_id);

-- Add partial index for system-wide permissions (where tenant_id IS NULL)
CREATE INDEX idx_permissions_system ON permissions(tenant_id) WHERE tenant_id IS NULL;