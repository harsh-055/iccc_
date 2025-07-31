-- Fix column name mismatch in role_permissions table
-- Change granted_at to assigned_at to match application code

-- Add the assigned_at column
ALTER TABLE role_permissions 
ADD COLUMN assigned_at TIMESTAMP;

-- Copy data from granted_at to assigned_at
UPDATE role_permissions 
SET assigned_at = granted_at;

-- Set default value for assigned_at
ALTER TABLE role_permissions 
ALTER COLUMN assigned_at SET DEFAULT CURRENT_TIMESTAMP;

-- Drop the old granted_at column
ALTER TABLE role_permissions 
DROP COLUMN granted_at;

-- Also add assigned_at to user_roles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_roles' AND column_name = 'assigned_at') THEN
        ALTER TABLE user_roles ADD COLUMN assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;