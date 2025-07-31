ALTER TABLE tenants DROP COLUMN IF EXISTS display_name;

-- Remove display_name from roles table
ALTER TABLE roles DROP COLUMN IF EXISTS display_name;

-- Remove display_name from permissions table
ALTER TABLE permissions DROP COLUMN IF EXISTS display_name;