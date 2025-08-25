-- Description: Add comprehensive visitor management system schema for ICCC monitoring module

-- =====================================================
-- 1. VISITOR PURPOSES (Lookup table)
-- =====================================================

CREATE TABLE IF NOT EXISTS visitor_purposes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. ENTRY GATES
-- =====================================================

CREATE TABLE IF NOT EXISTS entry_gates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    gate_number VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance')),
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. VISITORS
-- =====================================================

CREATE TABLE IF NOT EXISTS visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    id_type VARCHAR(50) CHECK (id_type IN ('Aadhar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID', 'Other')),
    id_number VARCHAR(100),
    company_name VARCHAR(255),
    designation VARCHAR(255),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    is_blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    photo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. ENTRY REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS entry_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    purpose_id UUID REFERENCES visitor_purposes(id),
    purpose_description TEXT,
    requested_entry_date DATE NOT NULL,
    requested_entry_time TIME NOT NULL,
    requested_exit_time TIME,
    host_name VARCHAR(255),
    host_phone VARCHAR(20),
    host_email VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. VISITOR LOGS (Entry/Exit tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS visitor_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    entry_request_id UUID REFERENCES entry_requests(id) ON DELETE SET NULL,
    entry_gate_id UUID REFERENCES entry_gates(id) ON DELETE SET NULL,
    log_type VARCHAR(20) NOT NULL CHECK (log_type IN ('Entry', 'Exit')),
    entry_time TIMESTAMP WITH TIME ZONE,
    exit_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    purpose VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Inside' CHECK (status IN ('Inside', 'Checked Out', 'Flagged')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. VISITOR ALERTS
-- =====================================================

CREATE TABLE IF NOT EXISTS visitor_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    visitor_log_id UUID REFERENCES visitor_logs(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('Unauthorized Entry', 'Overstay', 'Blacklisted Visitor', 'Suspicious Activity', 'Emergency')),
    alert_name VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT,
    location VARCHAR(255),
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Visitor indexes
CREATE INDEX IF NOT EXISTS idx_visitors_tenant_id ON visitors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visitors_qr_code ON visitors(qr_code);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone_number);
CREATE INDEX IF NOT EXISTS idx_visitors_is_active ON visitors(is_active);
CREATE INDEX IF NOT EXISTS idx_visitors_blacklisted ON visitors(is_blacklisted);

-- Entry requests indexes
CREATE INDEX IF NOT EXISTS idx_entry_requests_tenant_id ON entry_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entry_requests_visitor_id ON entry_requests(visitor_id);
CREATE INDEX IF NOT EXISTS idx_entry_requests_status ON entry_requests(status);
CREATE INDEX IF NOT EXISTS idx_entry_requests_date ON entry_requests(requested_entry_date);
CREATE INDEX IF NOT EXISTS idx_entry_requests_approved_by ON entry_requests(approved_by);

-- Visitor logs indexes
CREATE INDEX IF NOT EXISTS idx_visitor_logs_tenant_id ON visitor_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_id ON visitor_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_entry_request_id ON visitor_logs(entry_request_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_entry_gate_id ON visitor_logs(entry_gate_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_log_type ON visitor_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_status ON visitor_logs(status);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_entry_time ON visitor_logs(entry_time);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_exit_time ON visitor_logs(exit_time);

-- Entry gates indexes
CREATE INDEX IF NOT EXISTS idx_entry_gates_tenant_id ON entry_gates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entry_gates_site_id ON entry_gates(site_id);
CREATE INDEX IF NOT EXISTS idx_entry_gates_zone_id ON entry_gates(zone_id);
CREATE INDEX IF NOT EXISTS idx_entry_gates_status ON entry_gates(status);

-- Visitor alerts indexes
CREATE INDEX IF NOT EXISTS idx_visitor_alerts_tenant_id ON visitor_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visitor_alerts_visitor_id ON visitor_alerts(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_alerts_severity ON visitor_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_visitor_alerts_is_resolved ON visitor_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_visitor_alerts_created_at ON visitor_alerts(created_at);

-- =====================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_visitors_updated_at ON visitors;
CREATE TRIGGER update_visitors_updated_at 
    BEFORE UPDATE ON visitors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entry_requests_updated_at ON entry_requests;
CREATE TRIGGER update_entry_requests_updated_at 
    BEFORE UPDATE ON entry_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visitor_logs_updated_at ON visitor_logs;
CREATE TRIGGER update_visitor_logs_updated_at 
    BEFORE UPDATE ON visitor_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entry_gates_updated_at ON entry_gates;
CREATE TRIGGER update_entry_gates_updated_at 
    BEFORE UPDATE ON entry_gates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visitor_alerts_updated_at ON visitor_alerts;
CREATE TRIGGER update_visitor_alerts_updated_at 
    BEFORE UPDATE ON visitor_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. SEED DATA
-- =====================================================

-- Insert default visitor purposes
INSERT INTO visitor_purposes (name, description) VALUES
    ('Meeting with Manager', 'Business meetings with management'),
    ('Client Meeting', 'Meetings with external clients'),
    ('Interview', 'Job interviews'),
    ('Delivery', 'Package or document delivery'),
    ('Maintenance', 'Equipment or facility maintenance'),
    ('Inspection', 'Official inspections'),
    ('Training', 'Training sessions'),
    ('Water Board', 'Water board related visits'),
    ('Other', 'Other purposes not listed')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 10. FUNCTIONS FOR AUTOMATIC CALCULATIONS
-- =====================================================

-- Function to calculate visit duration
CREATE OR REPLACE FUNCTION calculate_visit_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.exit_time IS NOT NULL AND NEW.entry_time IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.exit_time - NEW.entry_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate duration
DROP TRIGGER IF EXISTS calculate_visitor_log_duration ON visitor_logs;
CREATE TRIGGER calculate_visitor_log_duration
    BEFORE INSERT OR UPDATE ON visitor_logs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_visit_duration();

-- Function to generate QR codes
CREATE OR REPLACE FUNCTION generate_visitor_qr_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code = 'QRC' || LPAD(NEW.id::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate QR codes
DROP TRIGGER IF EXISTS generate_visitor_qr_code_trigger ON visitors;
CREATE TRIGGER generate_visitor_qr_code_trigger
    BEFORE INSERT ON visitors
    FOR EACH ROW
    EXECUTE FUNCTION generate_visitor_qr_code(); 