-- Add account_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_id VARCHAR(255) UNIQUE;

-- Add tenant_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Add index for performance on tenant_id queries
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Add index for account_id lookups
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);

-- Update existing users to have a default tenant if needed
-- This is optional and depends on your business logic
-- UPDATE users SET tenant_id = (SELECT id FROM tenants WHERE name = 'Default' LIMIT 1) WHERE tenant_id IS NULL; 