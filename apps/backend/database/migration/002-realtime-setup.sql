-- Create the generic notification function that adapts to any schema
CREATE OR REPLACE FUNCTION notify_data_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  record_data JSON;
  old_data JSON;
BEGIN
  -- Skip notification if nothing actually changed
  IF TG_OP = 'UPDATE' AND OLD IS NOT DISTINCT FROM NEW THEN
    RETURN NEW;
  END IF;

  -- Build payload based on operation
  CASE TG_OP
    WHEN 'INSERT' THEN
      record_data = row_to_json(NEW);
      payload = json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'data', record_data,
        'timestamp', CURRENT_TIMESTAMP
      );
    WHEN 'UPDATE' THEN
      record_data = row_to_json(NEW);
      old_data = row_to_json(OLD);
      payload = json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'data', record_data,
        'oldData', old_data,
        'timestamp', CURRENT_TIMESTAMP
      );
    WHEN 'DELETE' THEN
      record_data = row_to_json(OLD);
      payload = json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'data', record_data,
        'timestamp', CURRENT_TIMESTAMP
      );
  END CASE;

  -- Send notification (with size limit for performance)
  IF LENGTH(payload::text) < 8000 THEN
    PERFORM pg_notify('data_change', payload::text);
  ELSE
    -- For large payloads, send only essential data
    PERFORM pg_notify('data_change', json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'id', COALESCE((record_data->>'id')::text, 'unknown'),
      'timestamp', CURRENT_TIMESTAMP,
      'truncated', true
    )::text);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create helper functions for trigger management
CREATE OR REPLACE FUNCTION add_realtime_trigger(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS %I_notify_trigger ON %I;
    CREATE TRIGGER %I_notify_trigger
    AFTER INSERT OR UPDATE OR DELETE ON %I
    FOR EACH ROW EXECUTE FUNCTION notify_data_change();
  ', table_name, table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_realtime_trigger(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('DROP TRIGGER IF EXISTS %I_notify_trigger ON %I;', 
    table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Create table to track realtime status
CREATE TABLE IF NOT EXISTS realtime_enabled_tables (
  table_name VARCHAR(255) PRIMARY KEY,
  enabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add triggers to your existing tables
SELECT add_realtime_trigger('users');
SELECT add_realtime_trigger('user_login_details');
SELECT add_realtime_trigger('mfa');

-- Record that these tables have realtime enabled
INSERT INTO realtime_enabled_tables (table_name) VALUES 
  ('users'), ('user_login_details'), ('mfa')
ON CONFLICT DO NOTHING;