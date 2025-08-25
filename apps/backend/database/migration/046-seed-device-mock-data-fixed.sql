-- Description: Seed mock device data for testing and development (Fixed version)
-- This migration creates sample devices that match the UI requirements

-- First, ensure we have the required lookup data
-- Insert device types if they don't exist
INSERT INTO device_types (name, description, is_active) 
SELECT 'Camera', 'Surveillance camera for monitoring', true
WHERE NOT EXISTS (SELECT 1 FROM device_types WHERE name = 'Camera');

INSERT INTO device_types (name, description, is_active) 
SELECT 'Sensors', 'IoT sensors for data collection', true
WHERE NOT EXISTS (SELECT 1 FROM device_types WHERE name = 'Sensors');

INSERT INTO device_types (name, description, is_active) 
SELECT 'GPS', 'GPS tracking devices', true
WHERE NOT EXISTS (SELECT 1 FROM device_types WHERE name = 'GPS');

INSERT INTO device_types (name, description, is_active) 
SELECT 'Smart Bin Sensor', 'Smart waste bin sensors', true
WHERE NOT EXISTS (SELECT 1 FROM device_types WHERE name = 'Smart Bin Sensor');

-- Insert manufacturers if they don't exist
INSERT INTO manufacturers (name, description, is_active) 
SELECT 'SensorX IoT Pvt Ltd', 'Leading IoT sensor manufacturer', true
WHERE NOT EXISTS (SELECT 1 FROM manufacturers WHERE name = 'SensorX IoT Pvt Ltd');

INSERT INTO manufacturers (name, description, is_active) 
SELECT 'TechCorp Industries', 'Technology solutions provider', true
WHERE NOT EXISTS (SELECT 1 FROM manufacturers WHERE name = 'TechCorp Industries');

INSERT INTO manufacturers (name, description, is_active) 
SELECT 'SmartCity Devices', 'Smart city infrastructure provider', true
WHERE NOT EXISTS (SELECT 1 FROM manufacturers WHERE name = 'SmartCity Devices');

-- Insert regions if they don't exist
INSERT INTO regions (name, description, is_active, tenant_id) 
SELECT 'Bangalore Central', 'Central Bangalore Region', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE name = 'Bangalore Central' AND tenant_id IS NULL);

INSERT INTO regions (name, description, is_active, tenant_id) 
SELECT 'Bangalore North', 'North Bangalore Region', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE name = 'Bangalore North' AND tenant_id IS NULL);

-- Insert zones if they don't exist (with proper region_id)
INSERT INTO zones (name, description, region_id, is_active, tenant_id) 
SELECT 'Zone A', 'Central Business District', r.id, true, NULL
FROM regions r
WHERE r.name = 'Bangalore Central'
AND NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Zone A' AND tenant_id IS NULL);

INSERT INTO zones (name, description, region_id, is_active, tenant_id) 
SELECT 'Zone B', 'Residential Area North', r.id, true, NULL
FROM regions r
WHERE r.name = 'Bangalore Central'
AND NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Zone B' AND tenant_id IS NULL);

-- Insert wards if they don't exist (with proper zone_id)
INSERT INTO wards (name, description, zone_id, is_active, tenant_id) 
SELECT 'Ward 1 - KR Market', 'KR Market Ward', z.id, true, NULL
FROM zones z
WHERE z.name = 'Zone A'
AND NOT EXISTS (SELECT 1 FROM wards WHERE name = 'Ward 1 - KR Market' AND tenant_id IS NULL);

INSERT INTO wards (name, description, zone_id, is_active, tenant_id) 
SELECT 'Ward 2 - Malleswaram', 'Malleswaram Ward', z.id, true, NULL
FROM zones z
WHERE z.name = 'Zone A'
AND NOT EXISTS (SELECT 1 FROM wards WHERE name = 'Ward 2 - Malleswaram' AND tenant_id IS NULL);

-- Insert nodes if they don't exist
INSERT INTO nodes (name, description, is_active, tenant_id) 
SELECT 'Node 1', 'Primary network node', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM nodes WHERE name = 'Node 1' AND tenant_id IS NULL);

INSERT INTO nodes (name, description, is_active, tenant_id) 
SELECT 'Node 2', 'Secondary network node', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM nodes WHERE name = 'Node 2' AND tenant_id IS NULL);

-- Get the IDs for reference and insert devices
DO $$
DECLARE
    camera_type_id UUID;
    sensors_type_id UUID;
    gps_type_id UUID;
    sensorx_manufacturer_id UUID;
    techcorp_manufacturer_id UUID;
    smartcity_manufacturer_id UUID;
    zone_a_id UUID;
    ward_kr_market_id UUID;
    node1_id UUID;
    current_tenant_id UUID;
    current_site_id UUID;
BEGIN
    -- Get device type IDs
    SELECT id INTO camera_type_id FROM device_types WHERE name = 'Camera';
    SELECT id INTO sensors_type_id FROM device_types WHERE name = 'Sensors';
    SELECT id INTO gps_type_id FROM device_types WHERE name = 'GPS';
    
    -- Get manufacturer IDs
    SELECT id INTO sensorx_manufacturer_id FROM manufacturers WHERE name = 'SensorX IoT Pvt Ltd';
    SELECT id INTO techcorp_manufacturer_id FROM manufacturers WHERE name = 'TechCorp Industries';
    SELECT id INTO smartcity_manufacturer_id FROM manufacturers WHERE name = 'SmartCity Devices';
    
    -- Get zone and ward IDs
    SELECT id INTO zone_a_id FROM zones WHERE name = 'Zone A';
    SELECT id INTO ward_kr_market_id FROM wards WHERE name = 'Ward 1 - KR Market';
    
    -- Get node ID
    SELECT id INTO node1_id FROM nodes WHERE name = 'Node 1';
    
    -- Get a tenant ID (assuming there's at least one tenant)
    SELECT id INTO current_tenant_id FROM tenants LIMIT 1;
    
    -- Get a site ID for device assignment (use your existing site)
    SELECT s.id INTO current_site_id 
    FROM sites s 
    WHERE s.tenant_id = current_tenant_id 
    AND s.zone_id = zone_a_id 
    AND s.ward_id = ward_kr_market_id
    LIMIT 1;
    
    -- If no matching site exists, get any site for this tenant
    IF current_site_id IS NULL THEN
        SELECT s.id INTO current_site_id 
        FROM sites s 
        WHERE s.tenant_id = current_tenant_id 
        LIMIT 1;
    END IF;
    
    -- If still no site exists, we'll create devices without site assignment
    IF current_site_id IS NULL THEN
        RAISE NOTICE 'No sites found for tenant, creating devices without site assignment';
    END IF;
    
    -- Insert mock devices only if they don't exist
    INSERT INTO devices (
        device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
        device_location, manufacturer_id, installed_on, warranty_expiry_date,
        health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
        multicasting_enabled, image_url, address,
        tenant_id, created_by
    )
    SELECT 
        'Smart Bin Sensor', '#DID1234', camera_type_id, node1_id, 'Active', zone_a_id, ward_kr_market_id, current_site_id,
        'Location 5', sensorx_manufacturer_id, '2024-05-12', '2026-05-12',
        'Good', 8080, '198.168.1.1', '198.168.1.1', '198.168.1.254',
        true, NULL, 'Smart City Office',
        current_tenant_id, NULL
    WHERE NOT EXISTS (SELECT 1 FROM devices WHERE device_id = '#DID1234');
    
    INSERT INTO devices (
        device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
        device_location, manufacturer_id, installed_on, warranty_expiry_date,
        health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
        multicasting_enabled, image_url, address,
        tenant_id, created_by
    )
    SELECT 
        'Smart Bin Sensor', '#DID1235', sensors_type_id, node1_id, 'Active', zone_a_id, ward_kr_market_id, current_site_id,
        'Location 5', sensorx_manufacturer_id, '2024-05-12', '2026-05-12',
        'Good', 8080, '198.168.1.1', '198.168.1.1', '198.168.1.254',
        true, NULL, 'Smart City Office',
        current_tenant_id, NULL
    WHERE NOT EXISTS (SELECT 1 FROM devices WHERE device_id = '#DID1235');
    
    INSERT INTO devices (
        device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
        device_location, manufacturer_id, installed_on, warranty_expiry_date,
        health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
        multicasting_enabled, image_url, address,
        tenant_id, created_by
    )
    SELECT 
        'Smart Bin Sensor', '#DID1236', gps_type_id, node1_id, 'Active', zone_a_id, ward_kr_market_id, current_site_id,
        'Location 5', techcorp_manufacturer_id, '2024-05-12', '2026-05-12',
        'Good', 8080, '198.168.1.1', '198.168.1.1', '198.168.1.254',
        true, NULL, 'Smart City Office',
        current_tenant_id, NULL
    WHERE NOT EXISTS (SELECT 1 FROM devices WHERE device_id = '#DID1236');
    
    INSERT INTO devices (
        device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
        device_location, manufacturer_id, installed_on, warranty_expiry_date,
        health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
        multicasting_enabled, image_url, address,
        tenant_id, created_by
    )
    SELECT 
        'Smart Bin Sensor', '#DID1237', camera_type_id, node1_id, 'Inactive', zone_a_id, ward_kr_market_id, current_site_id,
        'Location 5', smartcity_manufacturer_id, '2024-05-12', '2026-05-12',
        'Poor', 8080, '198.168.1.1', '198.168.1.1', '198.168.1.254',
        false, NULL, 'Smart City Office',
        current_tenant_id, NULL
    WHERE NOT EXISTS (SELECT 1 FROM devices WHERE device_id = '#DID1237');
    
    INSERT INTO devices (
        device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
        device_location, manufacturer_id, installed_on, warranty_expiry_date,
        health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
        multicasting_enabled, image_url, address,
        tenant_id, created_by
    )
    SELECT 
        'Smart Bin Sensor', '#DID1238', sensors_type_id, node1_id, 'Inactive', zone_a_id, ward_kr_market_id, current_site_id,
        'Location 5', sensorx_manufacturer_id, '2024-05-12', '2026-05-12',
        'Critical', 8080, '198.168.1.1', '198.168.1.1', '198.168.1.254',
        false, NULL, 'Smart City Office',
        current_tenant_id, NULL
    WHERE NOT EXISTS (SELECT 1 FROM devices WHERE device_id = '#DID1238');
    
    -- Insert some device alerts for testing
    INSERT INTO device_alerts (device_id, alert_type, description, timestamp, is_resolved)
    SELECT 
        d.id,
        CASE 
            WHEN d.status = 'Inactive' THEN 'Sensor Offline'
            ELSE 'Low Battery Alert'
        END,
        CASE 
            WHEN d.status = 'Inactive' THEN 'No data received in 8+ hrs'
            ELSE 'Battery of sensor below threshold'
        END,
        CURRENT_TIMESTAMP - INTERVAL '2 hours',
        false
    FROM devices d
    WHERE d.device_id IN ('#DID1237', '#DID1238')
    AND NOT EXISTS (
        SELECT 1 FROM device_alerts da 
        WHERE da.device_id = d.id 
        AND da.alert_type = CASE 
            WHEN d.status = 'Inactive' THEN 'Sensor Offline'
            ELSE 'Low Battery Alert'
        END
    );
    
END $$;