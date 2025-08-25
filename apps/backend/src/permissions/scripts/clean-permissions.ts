import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

async function cleanPermissions() {
  console.log('🔧 Starting to clean all permission entries from database...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    await client.query('BEGIN');

    // Delete all role-permission relationships first (foreign key constraint)
    const rolePermissionResult = await client.query('DELETE FROM role_permissions');
    console.log(`🗑️  Deleted ${rolePermissionResult.rowCount} role-permission relationships`);

    // Delete all user-permission relationships (if exists)
    const userPermissionResult = await client.query('DELETE FROM user_permissions');
    console.log(`🗑️  Deleted ${userPermissionResult.rowCount} user-permission relationships`);

    // Delete all permission entries
    const permissionResult = await client.query('DELETE FROM permissions');
    console.log(`🗑️  Deleted ${permissionResult.rowCount} permission entries`);

    await client.query('COMMIT');
    console.log('✅ All permission entries cleaned successfully!');
    console.log('📋 Table structures remain intact');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error cleaning permissions: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the cleaning if this file is executed directly
if (require.main === module) {
  cleanPermissions();
}

export { cleanPermissions }; 