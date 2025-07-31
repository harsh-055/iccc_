-- Add site_id column to users table for primary site relationship
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

-- Create user_sites junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, site_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_user_sites_user_id ON user_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sites_site_id ON user_sites(site_id);
CREATE INDEX IF NOT EXISTS idx_user_sites_assigned_by ON user_sites(assigned_by);