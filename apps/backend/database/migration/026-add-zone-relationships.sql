-- Migration: Add zone relationships to users and incidents tables
-- Description: This migration adds zone_id and ward_id columns to users and incidents tables
-- to enable zone filtering in the dashboard module.

-- =====================================================
-- 1. ADD ZONE RELATIONSHIPS TO USERS TABLE
-- =====================================================

-- Add zone_id and ward_id columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_zone_id ON users(zone_id);
CREATE INDEX IF NOT EXISTS idx_users_ward_id ON users(ward_id);
CREATE INDEX IF NOT EXISTS idx_users_zone_ward ON users(zone_id, ward_id);

-- =====================================================
-- 2. ADD ZONE RELATIONSHIPS TO INCIDENTS TABLE
-- =====================================================

-- Add zone_id and ward_id columns to incidents table
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incidents_zone_id ON incidents(zone_id);
CREATE INDEX IF NOT EXISTS idx_incidents_ward_id ON incidents(ward_id);
CREATE INDEX IF NOT EXISTS idx_incidents_zone_ward ON incidents(zone_id, ward_id);

-- =====================================================
-- 3. ADD ZONE RELATIONSHIPS TO ROUTES TABLE (if missing)
-- =====================================================

-- Ensure routes table has zone_id and ward_id (should already exist, but adding IF NOT EXISTS for safety)
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id) ON DELETE SET NULL;

-- Add indexes for routes if they don't exist
CREATE INDEX IF NOT EXISTS idx_routes_zone_id ON routes(zone_id);
CREATE INDEX IF NOT EXISTS idx_routes_ward_id ON routes(ward_id);
CREATE INDEX IF NOT EXISTS idx_routes_zone_ward ON routes(zone_id, ward_id);

-- =====================================================
-- 4. CREATE TRIGGERS FOR DATA INTEGRITY (instead of check constraints)
-- =====================================================

-- Function to validate zone-ward consistency for users
CREATE OR REPLACE FUNCTION validate_user_zone_ward_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- If ward_id is provided, ensure zone_id matches the ward's zone
    IF NEW.ward_id IS NOT NULL THEN
        IF NEW.zone_id IS NULL OR NEW.zone_id != (SELECT zone_id FROM wards WHERE id = NEW.ward_id) THEN
            NEW.zone_id := (SELECT zone_id FROM wards WHERE id = NEW.ward_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate zone-ward consistency for incidents
CREATE OR REPLACE FUNCTION validate_incident_zone_ward_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- If ward_id is provided, ensure zone_id matches the ward's zone
    IF NEW.ward_id IS NOT NULL THEN
        IF NEW.zone_id IS NULL OR NEW.zone_id != (SELECT zone_id FROM wards WHERE id = NEW.ward_id) THEN
            NEW.zone_id := (SELECT zone_id FROM wards WHERE id = NEW.ward_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate zone-ward consistency for routes
CREATE OR REPLACE FUNCTION validate_route_zone_ward_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- If ward_id is provided, ensure zone_id matches the ward's zone
    IF NEW.ward_id IS NOT NULL THEN
        IF NEW.zone_id IS NULL OR NEW.zone_id != (SELECT zone_id FROM wards WHERE id = NEW.ward_id) THEN
            NEW.zone_id := (SELECT zone_id FROM wards WHERE id = NEW.ward_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for data integrity
DROP TRIGGER IF EXISTS trigger_validate_user_zone_ward ON users;
CREATE TRIGGER trigger_validate_user_zone_ward
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_zone_ward_consistency();

DROP TRIGGER IF EXISTS trigger_validate_incident_zone_ward ON incidents;
CREATE TRIGGER trigger_validate_incident_zone_ward
    BEFORE INSERT OR UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION validate_incident_zone_ward_consistency();

DROP TRIGGER IF EXISTS trigger_validate_route_zone_ward ON routes;
CREATE TRIGGER trigger_validate_route_zone_ward
    BEFORE INSERT OR UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION validate_route_zone_ward_consistency();

-- =====================================================
-- 5. UPDATE EXISTING DATA (Optional - for data consistency)
-- =====================================================

-- Update incidents to have zone_id based on location_id if it references a site
-- This is optional and can be run separately if needed
-- UPDATE incidents i
-- SET zone_id = s.zone_id
-- FROM sites s
-- WHERE i.location_id = s.id AND i.zone_id IS NULL;

-- Update users to have zone_id based on their assigned sites or other criteria
-- This is optional and can be run separately if needed
-- UPDATE users u
-- SET zone_id = s.zone_id
-- FROM sites s
-- WHERE u.site_id = s.id AND u.zone_id IS NULL;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Verify the changes
DO $$
DECLARE
    users_with_zone INTEGER;
    incidents_with_zone INTEGER;
    routes_with_zone INTEGER;
BEGIN
    -- Check if columns were added successfully
    SELECT COUNT(*) INTO users_with_zone 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'zone_id';
    
    SELECT COUNT(*) INTO incidents_with_zone 
    FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'zone_id';
    
    SELECT COUNT(*) INTO routes_with_zone 
    FROM information_schema.columns 
    WHERE table_name = 'routes' AND column_name = 'zone_id';
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Users table has zone_id: %', CASE WHEN users_with_zone > 0 THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Incidents table has zone_id: %', CASE WHEN incidents_with_zone > 0 THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Routes table has zone_id: %', CASE WHEN routes_with_zone > 0 THEN 'YES' ELSE 'NO' END;
END $$; 