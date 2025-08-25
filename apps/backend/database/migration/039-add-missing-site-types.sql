-- Description: Add missing site types for dashboard statistics

-- Add missing site types that are referenced in the dashboard
INSERT INTO site_types (name, description) VALUES
('Fuel Station', 'Vehicle fuel refueling facility'),
('Workshop', 'Vehicle maintenance and repair facility')
ON CONFLICT (name) DO NOTHING;

-- Update the dashboard service to use actual site types instead of fuel types
-- This migration ensures the site types exist for proper dashboard statistics 