-- Seed global permissions (shared across all tenants)
-- These permissions will be available to all tenants

-- First, update existing permissions to be global (tenant_id = NULL)
UPDATE permissions SET tenant_id = NULL WHERE tenant_id IS NULL;

-- Add missing global permissions (only those that don't exist)
INSERT INTO permissions (name, resource, action, description, tenant_id, created_at, updated_at) 
SELECT * FROM (VALUES
  ('MANAGE_SYSTEM_CONFIG', 'system', 'manage_config', 'Manage system configuration and settings', NULL::uuid, NOW(), NOW()),
  ('ACCESS_DASHBOARD', 'dashboard', 'access', 'Access main dashboard and overview', NULL::uuid, NOW(), NOW()),
  ('VIEW_NOTIFICATIONS', 'notifications', 'view', 'View system notifications and alerts', NULL::uuid, NOW(), NOW()),
  ('MANAGE_NOTIFICATIONS', 'notifications', 'manage', 'Manage notification preferences and settings', NULL::uuid, NOW(), NOW()),
  ('EXPORT_DATA', 'data', 'export', 'Export data in various formats', NULL::uuid, NOW(), NOW()),
  ('IMPORT_DATA', 'data', 'import', 'Import data from external sources', NULL::uuid, NOW(), NOW()),
  ('GENERATE_REPORTS', 'reports', 'generate', 'Generate custom reports and analytics', NULL::uuid, NOW(), NOW()),
  ('VIEW_AUDIT_LOGS', 'audit', 'view_logs', 'View system audit logs and activity history', NULL::uuid, NOW(), NOW()),
  ('MANAGE_DEVICES', 'devices', 'manage', 'Manage connected devices and IoT equipment', NULL::uuid, NOW(), NOW()),
  ('VIEW_DEVICES', 'devices', 'view', 'View device status and information', NULL::uuid, NOW(), NOW()),
  ('MANAGE_EVENTS', 'events', 'manage', 'Manage system events and alerts', NULL::uuid, NOW(), NOW()),
  ('VIEW_EVENTS', 'events', 'view', 'View system events and alerts', NULL::uuid, NOW(), NOW()),
  ('MANAGE_ALERTS', 'alerts', 'manage', 'Manage system alerts and notifications', NULL::uuid, NOW(), NOW()),
  ('VIEW_ALERTS', 'alerts', 'view', 'View system alerts and notifications', NULL::uuid, NOW(), NOW()),
  ('ACCESS_SETTINGS', 'settings', 'access', 'Access system settings and configuration', NULL::uuid, NOW(), NOW()),
  ('VIEW_HELP', 'help', 'view', 'Access help documentation and support', NULL::uuid, NOW(), NOW()),
  ('CONTACT_SUPPORT', 'support', 'contact', 'Contact technical support and help desk', NULL::uuid, NOW(), NOW()),
  ('VIEW_ANALYTICS', 'analytics', 'view', 'View system analytics and metrics', NULL::uuid, NOW(), NOW()),
  ('GENERATE_ANALYTICS', 'analytics', 'generate', 'Generate custom analytics and insights', NULL::uuid, NOW(), NOW()),
  ('MANAGE_INTEGRATIONS', 'integrations', 'manage', 'Manage third-party integrations and APIs', NULL::uuid, NOW(), NOW()),
  ('VIEW_INTEGRATIONS', 'integrations', 'view', 'View integration status and information', NULL::uuid, NOW(), NOW()),
  ('MANAGE_BACKUPS', 'backups', 'manage', 'Manage system backups and data recovery', NULL::uuid, NOW(), NOW()),
  ('VIEW_BACKUPS', 'backups', 'view', 'View backup status and information', NULL::uuid, NOW(), NOW()),
  ('MANAGE_SECURITY', 'security', 'manage', 'Manage security settings and policies', NULL::uuid, NOW(), NOW()),
  ('VIEW_SECURITY', 'security', 'view', 'View security status and information', NULL::uuid, NOW(), NOW()),
  ('MANAGE_COMPLIANCE', 'compliance', 'manage', 'Manage compliance settings and policies', NULL::uuid, NOW(), NOW()),
  ('VIEW_COMPLIANCE', 'compliance', 'view', 'View compliance status and information', NULL::uuid, NOW(), NOW())
) AS new_permissions(name, resource, action, description, tenant_id, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM permissions 
  WHERE resource = new_permissions.resource 
    AND action = new_permissions.action 
    AND (tenant_id IS NULL OR tenant_id = new_permissions.tenant_id)
);

 