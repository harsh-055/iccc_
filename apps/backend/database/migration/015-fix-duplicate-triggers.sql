-- 015-fix-duplicate-triggers.sql
-- This migration fixes duplicate trigger issues by cleaning up and recreating triggers properly

-- Step 1: Drop all existing notification triggers to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find and drop all existing notify triggers
    FOR r IN 
        SELECT tgname, tgrelid::regclass as table_name 
        FROM pg_trigger 
        WHERE tgname LIKE '%_notify_trigger'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', r.tgname, r.table_name);
        RAISE NOTICE 'Dropped trigger % on table %', r.tgname, r.table_name;
    END LOOP;
END $$;

-- Step 2: Create an improved version of add_realtime_trigger that prevents duplicates
CREATE OR REPLACE FUNCTION add_realtime_trigger(table_name text)
RETURNS void AS $$
DECLARE
    trigger_name text;
    trigger_exists boolean;
BEGIN
    trigger_name := format('%s_notify_trigger', table_name);
    
    -- Check if trigger already exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = trigger_name
        AND tgrelid = table_name::regclass
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE 'Trigger % already exists on table %, skipping creation', trigger_name, table_name;
        RETURN;
    END IF;
    
    -- Create the trigger
    EXECUTE format('
        CREATE TRIGGER %I
        AFTER INSERT OR UPDATE OR DELETE ON %I
        FOR EACH ROW EXECUTE FUNCTION notify_data_change();
    ', trigger_name, table_name);
    
    RAISE NOTICE 'Created trigger % on table %', trigger_name, table_name;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Improve the notify_data_change function to include a unique identifier for deduplication
CREATE OR REPLACE FUNCTION notify_data_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  record_data JSON;
  old_data JSON;
  notification_id TEXT;
BEGIN
  -- Skip notification if nothing actually changed
  IF TG_OP = 'UPDATE' AND OLD IS NOT DISTINCT FROM NEW THEN
    RETURN NEW;
  END IF;
  
  -- Generate a unique notification ID for deduplication
  notification_id := md5(TG_TABLE_NAME || TG_OP || CURRENT_TIMESTAMP::text || random()::text);
  
  -- Build payload based on operation
  CASE TG_OP
    WHEN 'INSERT' THEN
      record_data = row_to_json(NEW);
      payload = json_build_object(
        'notification_id', notification_id,
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'data', record_data,
        'timestamp', CURRENT_TIMESTAMP
      );
    WHEN 'UPDATE' THEN
      record_data = row_to_json(NEW);
      old_data = row_to_json(OLD);
      payload = json_build_object(
        'notification_id', notification_id,
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'data', record_data,
        'oldData', old_data,
        'timestamp', CURRENT_TIMESTAMP
      );
    WHEN 'DELETE' THEN
      record_data = row_to_json(OLD);
      payload = json_build_object(
        'notification_id', notification_id,
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
      'notification_id', notification_id,
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

-- Step 4: Re-add triggers to the required tables (only once)
SELECT add_realtime_trigger('users');
SELECT add_realtime_trigger('user_login_details');
SELECT add_realtime_trigger('mfa');

-- Step 5: Verify triggers are created correctly
DO $$
DECLARE
    trigger_count INTEGER;
    r RECORD;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname LIKE '%_notify_trigger';
    
    RAISE NOTICE 'Total notification triggers created: %', trigger_count;
    
    -- Show all notification triggers
    RAISE NOTICE 'List of notification triggers:';
    FOR r IN 
        SELECT tgname, tgrelid::regclass as table_name 
        FROM pg_trigger 
        WHERE tgname LIKE '%_notify_trigger'
        ORDER BY tgrelid::regclass::text
    LOOP
        RAISE NOTICE '  - % on table %', r.tgname, r.table_name;
    END LOOP;
END $$;

-- Step 6: Add a helper function to check for duplicate triggers
CREATE OR REPLACE FUNCTION check_duplicate_triggers()
RETURNS TABLE(trigger_name text, table_name text, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tgname::text as trigger_name,
        tgrelid::regclass::text as table_name,
        COUNT(*) as count
    FROM pg_trigger
    WHERE tgname LIKE '%_notify_trigger'
    GROUP BY tgname, tgrelid
    HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;

-- Check for any duplicates (should return no rows)
SELECT * FROM check_duplicate_triggers();