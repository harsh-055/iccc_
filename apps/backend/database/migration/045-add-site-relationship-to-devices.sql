-- Description: Add site relationship to devices table
-- This migration adds the missing site_id field to link devices to specific sites

-- Add site_id column to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_devices_site_id ON devices(site_id);

-- Update existing devices to assign them to sites based on zone/ward matching
-- This is a one-time migration to populate site_id for existing devices
UPDATE devices 
SET site_id = (
    SELECT s.id 
    FROM sites s 
    WHERE s.zone_id = devices.zone_id 
    AND s.ward_id = devices.ward_id 
    AND s.is_active = true 
    LIMIT 1
)
WHERE devices.site_id IS NULL 
AND devices.zone_id IS NOT NULL 
AND devices.ward_id IS NOT NULL;

-- Add comment to document the relationship
COMMENT ON COLUMN devices.site_id IS 'Reference to the site where this device is installed/operating'; 