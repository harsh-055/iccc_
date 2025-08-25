-- First, let's add missing columns to the roles table if it exists
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Now modify the existing users table to match the new requirements
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS role_id UUID,
ADD COLUMN IF NOT EXISTS parent_id UUID,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Migrate existing name data to first_name and last_name
-- This assumes names are stored as "FirstName LastName"
-- Only run if name column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'name') THEN
        UPDATE users 
        SET 
            first_name = SPLIT_PART(name, ' ', 1),
            last_name = CASE 
                WHEN POSITION(' ' IN name) > 0 
                THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
                ELSE ''
            END
        WHERE first_name IS NULL OR last_name IS NULL;
    END IF;
END $$;

-- Make first_name and last_name NOT NULL after migration
ALTER TABLE users 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Drop the old name column (after verifying data migration)
ALTER TABLE users 
DROP COLUMN IF EXISTS name;

-- Add foreign key constraints (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_role' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_user_role 
            FOREIGN KEY (role_id) 
            REFERENCES roles(id) 
            ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_parent' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_user_parent 
            FOREIGN KEY (parent_id) 
            REFERENCES users(id) 
            ON DELETE SET NULL;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);

-- Clean up duplicate roles by keeping only the first one (by created_at or id)
WITH duplicate_groups AS (
    SELECT 
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY created_at, id) as rn
    FROM roles
),
roles_to_keep AS (
    SELECT id, LOWER(name) as name_lower 
    FROM duplicate_groups 
    WHERE rn = 1
),
roles_to_remove AS (
    SELECT id 
    FROM duplicate_groups 
    WHERE rn > 1
)
-- Update users to point to the role we're keeping
UPDATE users u
SET role_id = rtk.id
FROM roles_to_remove rtr
JOIN roles r ON rtr.id = r.id
JOIN roles_to_keep rtk ON LOWER(r.name) = rtk.name_lower
WHERE u.role_id = rtr.id;

-- Now delete the duplicate roles
DELETE FROM roles 
WHERE id IN (
    SELECT id 
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY created_at, id) as rn
        FROM roles
    ) ranked_roles
    WHERE rn > 1
);

-- Standardize role names to proper case
UPDATE roles 
SET name = CASE 
    WHEN LOWER(name) = 'admin' THEN 'Admin'
    WHEN LOWER(name) = 'user' THEN 'User'
    ELSE INITCAP(name)
END;

-- Drop existing index if it exists and recreate
DROP INDEX IF EXISTS idx_roles_name_unique;
CREATE UNIQUE INDEX idx_roles_name_unique ON roles(LOWER(name));

-- Insert or update default roles
INSERT INTO roles (name, description, is_active) 
VALUES 
    ('Admin', 'Administrator role with full access', true),
    ('User', 'Default user role with basic permissions', true)
ON CONFLICT (LOWER(name)) DO UPDATE 
SET 
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply the trigger to roles table
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Final verification
DO $$
DECLARE
    role_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO role_count FROM roles;
    SELECT COUNT(*) INTO user_count FROM users WHERE role_id IS NOT NULL;
    
    RAISE NOTICE 'Migration completed. Total roles: %, Users with roles: %', role_count, user_count;
END $$;