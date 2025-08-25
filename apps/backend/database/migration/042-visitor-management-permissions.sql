-- Description: Add visitor management permissions to the system

-- Insert visitor management permissions
INSERT INTO permissions (name, description, resource, action, tenant_id) VALUES
    ('MANAGE_VISITORS', 'Full visitor management - create, read, update, delete visitors', 'visitors', 'manage', NULL),
    ('VIEW_VISITORS', 'View and search visitors', 'visitors', 'view', NULL),
    ('CREATE_VISITORS', 'Create new visitors', 'visitors', 'create', NULL),
    ('UPDATE_VISITORS', 'Update visitor information', 'visitors', 'update', NULL),
    ('DELETE_VISITORS', 'Delete visitors (soft delete)', 'visitors', 'delete', NULL),
    
    ('MANAGE_ENTRY_REQUESTS', 'Full entry request management', 'entry_requests', 'manage', NULL),
    ('VIEW_ENTRY_REQUESTS', 'View entry requests', 'entry_requests', 'view', NULL),
    ('CREATE_ENTRY_REQUESTS', 'Create entry requests', 'entry_requests', 'create', NULL),
    ('APPROVE_ENTRY_REQUESTS', 'Approve or reject entry requests', 'entry_requests', 'approve', NULL),
    
    ('MANAGE_VISITOR_LOGS', 'Full visitor log management', 'visitor_logs', 'manage', NULL),
    ('VIEW_VISITOR_LOGS', 'View visitor logs', 'visitor_logs', 'view', NULL),
    ('CREATE_VISITOR_LOGS', 'Create visitor logs (entry/exit)', 'visitor_logs', 'create', NULL),
    ('EXPORT_VISITOR_LOGS', 'Export visitor log data', 'visitor_logs', 'export', NULL),
    
    ('VIEW_VISITOR_DASHBOARD', 'View visitor management dashboard', 'visitor_dashboard', 'view', NULL),
    ('VIEW_VISITOR_ANALYTICS', 'View visitor analytics and reports', 'visitor_analytics', 'view', NULL),
    
    ('MANAGE_ENTRY_GATES', 'Manage entry gates', 'entry_gates', 'manage', NULL),
    ('VIEW_ENTRY_GATES', 'View entry gates', 'entry_gates', 'view', NULL),
    
    ('VALIDATE_QR_CODES', 'Validate visitor QR codes', 'qr_codes', 'validate', NULL),
    ('GENERATE_QR_CODES', 'Generate QR codes for visitors', 'qr_codes', 'generate', NULL)
ON CONFLICT (resource, action) DO NOTHING;

-- Note: Role assignments will be handled separately through the application
-- or through a separate migration script to avoid complex SQL issues 