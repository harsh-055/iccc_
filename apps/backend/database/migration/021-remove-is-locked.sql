-- Remove is_locked column from users table
ALTER TABLE users DROP COLUMN IF EXISTS is_locked; 