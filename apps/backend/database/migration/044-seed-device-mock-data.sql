-- Description: Seed mock device data for testing and development
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
SELECT 'Zone 1', 'Central Business District', r.id, true, NULL
FROM regions r
WHERE r.name = 'Bangalore Central'
AND NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Zone 1' AND tenant_id IS NULL);

INSERT INTO zones (name, description, region_id, is_active, tenant_id) 
SELECT 'Zone 2', 'Residential Area North', r.id, true, NULL
FROM regions r
WHERE r.name = 'Bangalore Central'
AND NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Zone 2' AND tenant_id IS NULL);

INSERT INTO zones (name, description, region_id, is_active, tenant_id) 
SELECT 'Zone 3', 'Industrial Zone', r.id, true, NULL
FROM regions r
WHERE r.name = 'Bangalore Central'
AND NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Zone 3' AND tenant_id IS NULL);

INSERT INTO zones (name, description, region_id, is_active, tenant_id) 
SELECT 'Zone 4', 'Smart City Office Area', r.id, true, NULL
FROM regions r
WHERE r.name = 'Bangalore Central'
AND NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Zone 4' AND tenant_id IS NULL);

-- Insert wards if they don't exist (with proper zone_id)
INSERT INTO wards (name, description, zone_id, is_active, tenant_id) 
SELECT 'Ward 1', 'Central Ward', z.id, true, NULL
FROM zones z
WHERE z.name = 'Zone 1'
AND NOT EXISTS (SELECT 1 FROM wards WHERE name = 'Ward 1' AND tenant_id IS NULL);

INSERT INTO wards (name, description, zone_id, is_active, tenant_id) 
SELECT 'Ward 2', 'North Ward', z.id, true, NULL
FROM zones z
WHERE z.name = 'Zone 1'
AND NOT EXISTS (SELECT 1 FROM wards WHERE name = 'Ward 2' AND tenant_id IS NULL);

INSERT INTO wards (name, description, zone_id, is_active, tenant_id) 
SELECT 'Ward 3', 'South Ward', z.id, true, NULL
FROM zones z
WHERE z.name = 'Zone 1'
AND NOT EXISTS (SELECT 1 FROM wards WHERE name = 'Ward 3' AND tenant_id IS NULL);

INSERT INTO wards (name, description, zone_id, is_active, tenant_id) 
SELECT 'Ward 4', 'East Ward', z.id, true, NULL
FROM zones z
WHERE z.name = 'Zone 1'
AND NOT EXISTS (SELECT 1 FROM wards WHERE name = 'Ward 4' AND tenant_id IS NULL);

-- Insert nodes if they don't exist
INSERT INTO nodes (name, description, is_active, tenant_id) 
SELECT 'Node 1', 'Primary network node', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM nodes WHERE name = 'Node 1' AND tenant_id IS NULL);

INSERT INTO nodes (name, description, is_active, tenant_id) 
SELECT 'Node 2', 'Secondary network node', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM nodes WHERE name = 'Node 2' AND tenant_id IS NULL);

INSERT INTO nodes (name, description, is_active, tenant_id) 
SELECT 'Node 3', 'Backup network node', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM nodes WHERE name = 'Node 3' AND tenant_id IS NULL);

-- Get the IDs for reference and insert devices
DO $$
DECLARE
    camera_type_id UUID;
    sensors_type_id UUID;
    gps_type_id UUID;
    smart_bin_type_id UUID;
    sensorx_manufacturer_id UUID;
    techcorp_manufacturer_id UUID;
    smartcity_manufacturer_id UUID;
    zone1_id UUID;
    zone2_id UUID;
    zone3_id UUID;
    zone4_id UUID;
    ward1_id UUID;
    ward2_id UUID;
    ward3_id UUID;
    ward4_id UUID;
    node1_id UUID;
    node2_id UUID;
    node3_id UUID;
    tenant_id UUID;
    site_id UUID;
BEGIN
    -- Get device type IDs
    SELECT id INTO camera_type_id FROM device_types WHERE name = 'Camera';
    SELECT id INTO sensors_type_id FROM device_types WHERE name = 'Sensors';
    SELECT id INTO gps_type_id FROM device_types WHERE name = 'GPS';
    SELECT id INTO smart_bin_type_id FROM device_types WHERE name = 'Smart Bin Sensor';
    
    -- Get manufacturer IDs
    SELECT id INTO sensorx_manufacturer_id FROM manufacturers WHERE name = 'SensorX IoT Pvt Ltd';
    SELECT id INTO techcorp_manufacturer_id FROM manufacturers WHERE name = 'TechCorp Industries';
    SELECT id INTO smartcity_manufacturer_id FROM manufacturers WHERE name = 'SmartCity Devices';
    
    -- Get zone IDs
    SELECT id INTO zone1_id FROM zones WHERE name = 'Zone 1';
    SELECT id INTO zone2_id FROM zones WHERE name = 'Zone 2';
    SELECT id INTO zone3_id FROM zones WHERE name = 'Zone 3';
    SELECT id INTO zone4_id FROM zones WHERE name = 'Zone 4';
    
    -- Get ward IDs
    SELECT id INTO ward1_id FROM wards WHERE name = 'Ward 1';
    SELECT id INTO ward2_id FROM wards WHERE name = 'Ward 2';
    SELECT id INTO ward3_id FROM wards WHERE name = 'Ward 3';
    SELECT id INTO ward4_id FROM wards WHERE name = 'Ward 4';
    
    -- Get node IDs
    SELECT id INTO node1_id FROM nodes WHERE name = 'Node 1';
    SELECT id INTO node2_id FROM nodes WHERE name = 'Node 2';
    SELECT id INTO node3_id FROM nodes WHERE name = 'Node 3';
    
    -- Get a tenant ID (assuming there's at least one tenant)
    SELECT id INTO tenant_id FROM tenants LIMIT 1;
    
    -- Get a site ID for device assignment (assuming there's at least one site)
    SELECT s.id INTO site_id FROM sites s WHERE s.tenant_id = tenant_id LIMIT 1;
    
    -- If no site exists, we'll skip device creation
    IF site_id IS NULL THEN
        RAISE NOTICE 'No sites found for tenant, skipping device creation';
        RETURN;
    END IF;
    
    -- Insert mock devices only if they don't exist
    INSERT INTO devices (
        device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
        device_location, manufacturer_id, installed_on, warranty_expiry_date,
        health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
        multicasting_enabled, image_url, address, latitude, longitude,
        tenant_id, created_by
    )
    SELECT 
        'Device Name', '#DID1234', camera_type_id, node1_id, 'Active', zone1_id, ward1_id, site_id,
        'Location 5', sensorx_manufacturer_id, '2024-05-12', '2026-05-12',
        'Good', 8080, '198.168.1.1', '198.168.1.1', '198.168.1.254',
        true, NULL, 'Smart City Office', 12.9716, 77.5946,
        tenant_id, NULL
    WHERE NOT EXISTS (SELECT 1 FROM devices WHERE device_id = '#DID1234');
    
    INSERT INTO devices (
        device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
        device_location, manufacturer_id, installed_on, warranty_expiry_date,
        health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
        multicasting_enabled, image_url, address, latitude, longitude,
        tenant_id, created_by
    )
    SELECT 
        'Device Name', '#DID1235', sensors_type_id, node1_id, 'Active', zone1_id, ward1_id, site_id,
        'Location 5', sensorx_manufacturer_id, '2024-05-12', '2026-05-12',
        'Good', 8080, '198.168.1.1', '198.168.1.1', '198.168.1.254',
        true, NULL, 'Smart City Office', 12.9716, 77.5946,
        tenant_id, NULL
    WHERE NOT EXISTS (SELECT 1 FROM devices WHERE device_id = '#DID1235');
    
    INSERT INTO devices (
        device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
        device_location, manufacturer_id, installed_on, warranty_expiry_date,
        health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
        multicasting_enabled, image_url, address, latitude, longitude,
        tenant_id, created_by
    )
    SELECT 
        'Device Name', '#DID1236', gps_type_id, node1_id, 'Active', zone1_id, ward1_id, site_id,
        'Location 5', techcorp_manufacturer_id, '2024-05-12', '2026-05-12',
        'Good', 8080, '198.168.1.1', '198.168.1.1', '198.168.1.254',
        true, NULL, 'Smart City Office', 12.9716, 77.5946,
        tenant_id, NULL
    WHERE NOT EXISTS (SELECT 1 FROM devices WHERE device_id = '#DID1236');
    
    INSERT INTO devices (
        device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
        device_location, manufacturer_id, installed_on, warranty_expiry_date,
        health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
        multicasting_enabled, image_url, address, latitude, longitude,
        tenant_id, created_by
    )
    SELECT 
        'Device Name', '#DID1237', camera_type_id, node1_id, 'Active', zone1_id, ward1_id, site_id,
        'Location 5', smartcity_manufacturer_id, '2024-05-12', '2026-05-12',
        'Good', 8080, '198.168.1.1', '198.168.1.1', '198.168.1.254',
        true, NULL, 'Smart City Office', 12.9716, 77.5946,
        tenant_id, NULL
    WHERE NOT EXISTS (SELECT 1 FROM devices WHERE device_id = '#DID1237');
    
    INSERT INTO devices (
        device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
        device_location, manufacturer_id, installed_on, warranty_expiry_date,
        health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
        multicasting_enabled, image_url, address, latitude, longitude,
        tenant_id, created_by
    )
    SELECT 
        'Device Name', '#DID1238', sensors_type_id, node1_id, 'Active', zone1_id, ward1_id, site_id,
        'Location 5', sensorx_manufacturer_id, '2024-05-12', '2026-05-12',
        'Good', 8080, '198.168.1.1', '198.168.1.1', '198.168.1.254',
        true, NULL, 'Smart City Office', 12.9716, 77.5946,
        tenant_id, NULL
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
    WHERE d.device_id IN ('#DID1234', '#DID1235', '#DID1236', '#DID1237', '#DID1238')
    AND NOT EXISTS (
        SELECT 1 FROM device_alerts da 
        WHERE da.device_id = d.id 
        AND da.alert_type = CASE 
            WHEN d.status = 'Inactive' THEN 'Sensor Offline'
            ELSE 'Low Battery Alert'
        END
    );
    
END $$; 