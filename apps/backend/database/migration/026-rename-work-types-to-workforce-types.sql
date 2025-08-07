-- Description: Rename work_types table to workforce_types and update references

-- =====================================================
-- 1. RENAME TABLE AND UPDATE REFERENCES
-- =====================================================

-- First, drop the foreign key constraint from workforce table
ALTER TABLE workforce DROP CONSTRAINT IF EXISTS workforce_work_type_id_fkey;

-- Rename the table from work_types to workforce_types
ALTER TABLE work_types RENAME TO workforce_types;

-- Rename the column from work_type_id to workforce_type_id
ALTER TABLE workforce RENAME COLUMN work_type_id TO workforce_type_id;

-- Add the new foreign key constraint with the correct table name
ALTER TABLE workforce ADD CONSTRAINT workforce_workforce_type_id_fkey 
    FOREIGN KEY (workforce_type_id) REFERENCES workforce_types(id);

-- =====================================================
-- 2. UPDATE INDEX NAMES
-- =====================================================

-- Drop the old index if it exists
DROP INDEX IF EXISTS idx_workforce_work_type_id;

-- Create the new index with correct name
CREATE INDEX IF NOT EXISTS idx_workforce_workforce_type_id ON workforce(workforce_type_id);

-- =====================================================
-- 3. UPDATE COMMENTS
-- =====================================================

COMMENT ON TABLE workforce_types IS 'Workforce types lookup table';
COMMENT ON COLUMN workforce.workforce_type_id IS 'Reference to workforce_types table';

-- =====================================================
-- MIGRATION COMPLETE
-- ===================================================== 