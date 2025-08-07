
-- Description: Add comprehensive manage module schema for ICCC solid waste management

-- =====================================================
-- 1. REGIONAL HIERARCHY (Regions, Zones, Wards)
-- =====================================================

-- Regions table (top level geographical division)
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Zones table (sub-division of regions)
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wards table (sub-division of zones)
CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. SITES (Points of Interest)
-- =====================================================

-- Site Types lookup table
CREATE TABLE IF NOT EXISTS site_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    site_type_id UUID REFERENCES site_types(id),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    region_id UUID REFERENCES regions(id),
    zone_id UUID REFERENCES zones(id),
    ward_id UUID REFERENCES wards(id),
    capacity_tons DECIMAL(10,2),
    current_load_tons DECIMAL(10,2) DEFAULT 0,
    supervisor_id UUID REFERENCES users(id),
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. VEHICLES
-- =====================================================

-- Vehicle Types lookup table
CREATE TABLE IF NOT EXISTS vehicle_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fuel Types lookup table
CREATE TABLE IF NOT EXISTS fuel_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vehicle_type_id UUID REFERENCES vehicle_types(id),
    license_plate_number VARCHAR(50) UNIQUE NOT NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    fuel_type_id UUID REFERENCES fuel_types(id),
    insurance_expiry_date DATE NOT NULL,
    last_maintenance_date DATE NOT NULL,
    enable_gps_tracking BOOLEAN DEFAULT true,
    assigned_driver_id UUID REFERENCES users(id),
    assigned_region_id UUID REFERENCES regions(id),
    assigned_zone_id UUID REFERENCES zones(id),
    assigned_ward_id UUID REFERENCES wards(id),
    status VARCHAR(50) DEFAULT 'Inactive' CHECK (status IN ('On Trip', 'Inactive', 'Idle', 'Maintenance')),
    image_url VARCHAR(500),
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. DEVICES
-- =====================================================

-- Device Types lookup table
CREATE TABLE IF NOT EXISTS device_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Manufacturers lookup table
CREATE TABLE IF NOT EXISTS manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Nodes/Sites for device placement
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    site_id UUID REFERENCES sites(id),
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_name VARCHAR(255) NOT NULL,
    device_id VARCHAR(100) UNIQUE NOT NULL, -- e.g., "#DID1234", "SNSR-WFD-232"
    device_type_id UUID REFERENCES device_types(id),
    node_id UUID REFERENCES nodes(id),
    status VARCHAR(50) DEFAULT 'Inactive' CHECK (status IN ('Active', 'Inactive')),
    zone_id UUID REFERENCES zones(id),
    ward_id UUID REFERENCES wards(id),
    device_location VARCHAR(255),
    manufacturer_id UUID REFERENCES manufacturers(id),
    installed_on DATE,
    warranty_expiry_date DATE,
    health_status VARCHAR(50) DEFAULT 'Good' CHECK (health_status IN ('Good', 'Fair', 'Poor', 'Critical')),
    http_port INTEGER,
    base_ip_address INET,
    start_ip_address INET,
    end_ip_address INET,
    multicasting_enabled BOOLEAN DEFAULT false,
    image_url VARCHAR(500),
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device Alerts table
CREATE TABLE IF NOT EXISTS device_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. INVENTORY
-- =====================================================

-- Inventory Items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "ID001"
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(100),
    total_units INTEGER DEFAULT 0,
    assigned_units INTEGER DEFAULT 0,
    unassigned_units INTEGER DEFAULT 0,
    low_stock_alert_zones TEXT[], -- Array of zone names for low stock alerts
    unit_of_measure VARCHAR(50),
    storage_location_id UUID REFERENCES sites(id),
    manufacturer_id UUID REFERENCES manufacturers(id),
    purchase_date DATE,
    expiry_date DATE,
    condition VARCHAR(50) DEFAULT 'Good',
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. WORKFORCE
-- =====================================================

-- Work Types lookup table (will be renamed to workforce_types in next migration)
CREATE TABLE IF NOT EXISTS work_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    region_id UUID REFERENCES regions(id),
    zone_id UUID REFERENCES zones(id),
    ward_id UUID REFERENCES wards(id),
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    time_range VARCHAR(100) NOT NULL, -- e.g., "6AM - 12PM"
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workforce table
CREATE TABLE IF NOT EXISTS workforce (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    work_type_id UUID REFERENCES work_types(id),
    status VARCHAR(50) DEFAULT 'Absent' CHECK (status IN ('On Duty', 'Absent', 'Off Duty')),
    region_id UUID REFERENCES regions(id),
    zone_id UUID REFERENCES zones(id),
    ward_id UUID REFERENCES wards(id),
    assigned_route_id UUID REFERENCES routes(id),
    -- assigned_sites handled by junction table below
    shift_id UUID REFERENCES shifts(id),
    vehicle_id UUID REFERENCES vehicles(id),
    supervisor_id UUID REFERENCES users(id),
    has_gloves BOOLEAN DEFAULT false,
    has_uniform_sets BOOLEAN DEFAULT false,
    has_brooms BOOLEAN DEFAULT false,
    has_vehicle BOOLEAN DEFAULT false,
    image_url VARCHAR(500),
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workforce Equipment Assignment (Many-to-Many)
CREATE TABLE IF NOT EXISTS workforce_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workforce_id UUID NOT NULL REFERENCES workforce(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    returned_at TIMESTAMP WITH TIME ZONE,
    assigned_by UUID REFERENCES users(id),
    UNIQUE(workforce_id, inventory_item_id)
);

-- Workforce Site Assignment (Many-to-Many)
CREATE TABLE IF NOT EXISTS workforce_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workforce_id UUID NOT NULL REFERENCES workforce(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    UNIQUE(workforce_id, site_id)
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Regional hierarchy indexes
CREATE INDEX IF NOT EXISTS idx_regions_tenant_id ON regions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_zones_region_id ON zones(region_id);
CREATE INDEX IF NOT EXISTS idx_zones_tenant_id ON zones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wards_zone_id ON wards(zone_id);
CREATE INDEX IF NOT EXISTS idx_wards_tenant_id ON wards(tenant_id);

-- Sites indexes
CREATE INDEX IF NOT EXISTS idx_sites_site_type_id ON sites(site_type_id);
CREATE INDEX IF NOT EXISTS idx_sites_region_id ON sites(region_id);
CREATE INDEX IF NOT EXISTS idx_sites_zone_id ON sites(zone_id);
CREATE INDEX IF NOT EXISTS idx_sites_ward_id ON sites(ward_id);
CREATE INDEX IF NOT EXISTS idx_sites_supervisor_id ON sites(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type_id ON vehicles(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type_id ON vehicles(fuel_type_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_driver_id ON vehicles(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration_number ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);

-- Devices indexes
CREATE INDEX IF NOT EXISTS idx_devices_device_type_id ON devices(device_type_id);
CREATE INDEX IF NOT EXISTS idx_devices_node_id ON devices(node_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_zone_id ON devices(zone_id);
CREATE INDEX IF NOT EXISTS idx_devices_ward_id ON devices(ward_id);
CREATE INDEX IF NOT EXISTS idx_devices_manufacturer_id ON devices(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_tenant_id ON devices(tenant_id);

-- Device alerts indexes
CREATE INDEX IF NOT EXISTS idx_device_alerts_device_id ON device_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_device_alerts_alert_type ON device_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_device_alerts_is_resolved ON device_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_device_alerts_timestamp ON device_alerts(timestamp);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_item_id ON inventory_items(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_item_type ON inventory_items(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_storage_location_id ON inventory_items(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_id ON inventory_items(tenant_id);

-- Workforce indexes
CREATE INDEX IF NOT EXISTS idx_workforce_work_type_id ON workforce(work_type_id);
CREATE INDEX IF NOT EXISTS idx_workforce_status ON workforce(status);
CREATE INDEX IF NOT EXISTS idx_workforce_region_id ON workforce(region_id);
CREATE INDEX IF NOT EXISTS idx_workforce_zone_id ON workforce(zone_id);
CREATE INDEX IF NOT EXISTS idx_workforce_ward_id ON workforce(ward_id);
CREATE INDEX IF NOT EXISTS idx_workforce_assigned_route_id ON workforce(assigned_route_id);
CREATE INDEX IF NOT EXISTS idx_workforce_shift_id ON workforce(shift_id);
CREATE INDEX IF NOT EXISTS idx_workforce_vehicle_id ON workforce(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_workforce_supervisor_id ON workforce(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_workforce_tenant_id ON workforce(tenant_id);

-- Workforce equipment indexes
CREATE INDEX IF NOT EXISTS idx_workforce_equipment_workforce_id ON workforce_equipment(workforce_id);
CREATE INDEX IF NOT EXISTS idx_workforce_equipment_inventory_item_id ON workforce_equipment(inventory_item_id);

-- Workforce sites indexes
CREATE INDEX IF NOT EXISTS idx_workforce_sites_workforce_id ON workforce_sites(workforce_id);
CREATE INDEX IF NOT EXISTS idx_workforce_sites_site_id ON workforce_sites(site_id);
CREATE INDEX IF NOT EXISTS idx_workforce_sites_assigned_by ON workforce_sites(assigned_by);

-- =====================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Add updated_at triggers for all tables
CREATE TRIGGER update_regions_updated_at 
    BEFORE UPDATE ON regions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at 
    BEFORE UPDATE ON zones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wards_updated_at 
    BEFORE UPDATE ON wards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at 
    BEFORE UPDATE ON sites 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at 
    BEFORE UPDATE ON vehicles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at 
    BEFORE UPDATE ON inventory_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workforce_updated_at 
    BEFORE UPDATE ON workforce 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at 
    BEFORE UPDATE ON nodes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at 
    BEFORE UPDATE ON routes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at 
    BEFORE UPDATE ON shifts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. REALTIME TRIGGERS
-- =====================================================

-- Add realtime triggers for all main tables
SELECT add_realtime_trigger('regions');
SELECT add_realtime_trigger('zones');
SELECT add_realtime_trigger('wards');
SELECT add_realtime_trigger('sites');
SELECT add_realtime_trigger('vehicles');
SELECT add_realtime_trigger('devices');
SELECT add_realtime_trigger('inventory_items');
SELECT add_realtime_trigger('workforce');
SELECT add_realtime_trigger('workforce_sites');
SELECT add_realtime_trigger('device_alerts');

-- =====================================================
-- 10. SEED DATA FOR LOOKUP TABLES
-- =====================================================

-- Insert default site types
INSERT INTO site_types (name, description) VALUES
('Transfer Station', 'Waste transfer facility'),
('MRF', 'Material Recovery Facility'),
('Weighbridge', 'Weighing station'),
('Landfill', 'Waste disposal site'),
('Composting Plant', 'Organic waste processing facility')
ON CONFLICT (name) DO NOTHING;

-- Insert default vehicle types
INSERT INTO vehicle_types (name, description) VALUES
('Auto Tipper', 'Small waste collection vehicle'),
('Truck', 'Large waste collection vehicle'),
('Sweeper', 'Street cleaning vehicle'),
('Loader', 'Waste loading vehicle')
ON CONFLICT (name) DO NOTHING;

-- Insert default fuel types
INSERT INTO fuel_types (name, description) VALUES
('Petrol', 'Petroleum fuel'),
('Diesel', 'Diesel fuel'),
('Electric', 'Electric powered'),
('Hybrid', 'Hybrid fuel system')
ON CONFLICT (name) DO NOTHING;

-- Insert default device types
INSERT INTO device_types (name, description) VALUES
('Camera', 'Surveillance camera'),
('Sensors', 'Environmental sensors'),
('GPS', 'Global positioning system'),
('Smart Bin Sensor', 'Waste bin monitoring sensor')
ON CONFLICT (name) DO NOTHING;

-- Insert default work types
INSERT INTO work_types (name, description) VALUES
('Door-to-Door Collector', 'Household waste collection'),
('Street Sweeper', 'Street cleaning'),
('Loader/Helper', 'Waste loading assistance'),
('Drainage Cleaner', 'Drainage system maintenance'),
('Auto Driver', 'Vehicle operation')
ON CONFLICT (name) DO NOTHING;

-- Insert default manufacturers
INSERT INTO manufacturers (name, description) VALUES
('SensorX IoT Pvt Ltd', 'IoT sensor manufacturer'),
('VehicleCorp', 'Vehicle manufacturer'),
('TechSolutions', 'Technology solutions provider')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 11. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE regions IS 'Top level geographical divisions for waste management';
COMMENT ON TABLE zones IS 'Sub-divisions of regions for operational management';
COMMENT ON TABLE wards IS 'Smallest geographical units within zones';
COMMENT ON TABLE sites IS 'Sites - waste management facilities';
COMMENT ON TABLE vehicles IS 'Fleet vehicles for waste collection and transportation';
COMMENT ON TABLE devices IS 'IoT devices and sensors for monitoring';
COMMENT ON TABLE inventory_items IS 'Equipment and supplies for workforce';
COMMENT ON TABLE workforce IS 'Personnel managing waste collection operations';
COMMENT ON TABLE device_alerts IS 'Alerts and notifications from devices';
COMMENT ON TABLE workforce_equipment IS 'Equipment assignments to workforce members';
COMMENT ON TABLE workforce_sites IS 'Site assignments to workforce members';

-- =====================================================
-- MIGRATION COMPLETE
-- ===================================================== 