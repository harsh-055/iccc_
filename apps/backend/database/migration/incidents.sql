-- Enable UUID extension (consistent with other modules)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL, 
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Constraints for valid coordinates
    CONSTRAINT chk_location_coordinates CHECK (
        latitude >= -90 AND latitude <= 90 AND 
        longitude >= -180 AND longitude <= 180
    ),
    CONSTRAINT chk_type_not_empty CHECK (LENGTH(TRIM(type)) > 0)
);

-- Step 2: Create incidents table (aligned with other modules)
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    media_type VARCHAR(20) NOT NULL DEFAULT 'image',
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    location VARCHAR(255) NOT NULL,
    camera VARCHAR(100) NOT NULL,
    datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
    category VARCHAR(100) NOT NULL,
    is_confirmed BOOLEAN DEFAULT NULL,  -- NULL = pending, TRUE = confirmed, FALSE = denied
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Constraints
    CONSTRAINT chk_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT chk_location_not_empty CHECK (LENGTH(TRIM(location)) > 0),
    CONSTRAINT chk_camera_not_empty CHECK (LENGTH(TRIM(camera)) > 0),
    CONSTRAINT chk_media_url_not_empty CHECK (LENGTH(TRIM(media_url)) > 0),
    CONSTRAINT chk_media_type CHECK (media_type IN ('image', 'video'))
);

-- Step 3: Remove incident_bookmarks table (using boolean in incidents table instead)
-- DROP TABLE IF EXISTS incident_bookmarks;

-- Step 4: Create event_timeline table
CREATE TABLE IF NOT EXISTS event_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    time VARCHAR(20) NOT NULL,
    event VARCHAR(255) NOT NULL,
    system_generated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_time_not_empty CHECK (LENGTH(TRIM(time)) > 0),
    CONSTRAINT chk_event_not_empty CHECK (LENGTH(TRIM(event)) > 0)
);

-- Step 5: Create event_details table
CREATE TABLE IF NOT EXISTS event_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    system_generated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_label_not_empty CHECK (LENGTH(TRIM(label)) > 0),
    CONSTRAINT chk_value_not_empty CHECK (LENGTH(TRIM(value)) > 0),
    UNIQUE(incident_id, label)
);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_datetime ON incidents(datetime DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_critical ON incidents(is_critical) WHERE is_critical = TRUE;
CREATE INDEX IF NOT EXISTS idx_incidents_confirmed ON incidents(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_incidents_bookmarked ON incidents(is_bookmarked) WHERE is_bookmarked = TRUE;
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents(location);
CREATE INDEX IF NOT EXISTS idx_incidents_camera ON incidents(camera);
CREATE INDEX IF NOT EXISTS idx_incidents_location_id ON incidents(location_id);
CREATE INDEX IF NOT EXISTS idx_incidents_tenant_id ON incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_confirmed_by ON incidents(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_incidents_active ON incidents(is_active);
CREATE INDEX IF NOT EXISTS idx_incidents_category_datetime ON incidents(category, datetime DESC);
CREATE INDEX IF NOT EXISTS idx_event_timeline_incident_id ON event_timeline(incident_id);
CREATE INDEX IF NOT EXISTS idx_event_timeline_time ON event_timeline(incident_id, time);
CREATE INDEX IF NOT EXISTS idx_event_details_incident_id ON event_details(incident_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);

-- Step 7: Create trigger for automatic timestamp updates (using existing function)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at 
    BEFORE UPDATE ON incidents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();