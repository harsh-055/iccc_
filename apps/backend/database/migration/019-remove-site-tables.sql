-- Remove all site-related database objects

-- Drop indexes first to avoid dependency issues
DROP INDEX IF EXISTS idx_users_site_id;
DROP INDEX IF EXISTS idx_user_sites_user_id;
DROP INDEX IF EXISTS idx_user_sites_site_id;
DROP INDEX IF EXISTS idx_user_sites_assigned_by;
DROP INDEX IF EXISTS idx_sites_tenant_id;
DROP INDEX IF EXISTS idx_sites_created_by;

-- Drop trigger
DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;

-- Drop tables in dependency order
DROP TABLE IF EXISTS user_sites;

-- Remove site_id column from users table
ALTER TABLE users DROP COLUMN IF EXISTS site_id;

-- Drop the sites table with CASCADE to handle dependencies
DROP TABLE IF EXISTS sites CASCADE;

-- Note: This removes all site-related functionality from the database
-- The following tables and columns have been removed:
-- - sites table (with all site records)
-- - user_sites junction table  
-- - site_id column from users table
-- - All related indexes and triggers