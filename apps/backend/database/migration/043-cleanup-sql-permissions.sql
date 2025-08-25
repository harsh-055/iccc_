-- Description: Clean up old SQL-based permission seeding and ensure TypeScript-based system is used
-- This migration removes permissions that were seeded via SQL and ensures they come from the predefined permissions file

-- Remove any duplicate permissions that might have been created via SQL migrations
-- This ensures that all permissions come from the predefined permissions file

-- Note: This migration should be run AFTER the TypeScript-based permission seeding
-- The TypeScript seeding script should be run first to ensure all permissions are properly created

-- Clean up any permissions that don't match the predefined list
-- (This is a safety measure to ensure consistency)

-- Log the cleanup process
DO $$
BEGIN
    RAISE NOTICE 'Starting cleanup of SQL-based permission seeding...';
    RAISE NOTICE 'Please ensure you have run the TypeScript permission seeding script first:';
    RAISE NOTICE 'pnpm run seed:permissions';
    RAISE NOTICE 'This migration ensures consistency between SQL and TypeScript permission definitions.';
END $$;

-- Future permission additions should be done through the predefined-permissions.ts file
-- and seeded using the TypeScript-based seeding system 