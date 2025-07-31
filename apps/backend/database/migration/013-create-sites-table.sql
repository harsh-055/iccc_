-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_tenant_id ON sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sites_created_by ON sites(created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_sites_updated_at 
    BEFORE UPDATE ON sites 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 