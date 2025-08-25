-- Migration: 047-add-region-fields.sql
-- Description: Add zone_no to zones table and ward_no to wards table for better data organization
-- Date: 2025-01-27

-- Add zone_no to zones table
ALTER TABLE zones 
ADD COLUMN IF NOT EXISTS zone_no INTEGER;

-- Add ward_no to wards table  
ALTER TABLE wards 
ADD COLUMN IF NOT EXISTS ward_no INTEGER;

-- Add supervisor_id to regions table (this makes sense to keep in regions)
ALTER TABLE regions 
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES users(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_zones_zone_no ON zones(zone_no);
CREATE INDEX IF NOT EXISTS idx_wards_ward_no ON wards(ward_no);
CREATE INDEX IF NOT EXISTS idx_regions_supervisor_id ON regions(supervisor_id);

-- Add comments for documentation
COMMENT ON COLUMN zones.zone_no IS 'Zone number for ordering and display';
COMMENT ON COLUMN wards.ward_no IS 'Ward number for ordering and display';
COMMENT ON COLUMN regions.supervisor_id IS 'Supervisor user ID for the region';

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 047: Added zone_no to zones, ward_no to wards, and supervisor_id to regions successfully';
END $$; 