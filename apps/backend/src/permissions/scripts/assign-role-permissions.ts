import { Client } from 'pg';
import { config } from 'dotenv';
import { ROLE_PERMISSION_MAPPINGS, getPermissionsForRole } from '../config/role-permission-mapping';

// Load environment variables
config();

async function assignRolePermissions() {
  console.log('🔗 Starting to assign permissions to roles...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    await client.query('BEGIN');

    let totalAssignments = 0;
    let skippedAssignments = 0;

    // Process each role mapping
    for (const mapping of ROLE_PERMISSION_MAPPINGS) {
      console.log(`\n📋 Processing role: ${mapping.roleName}`);
      
      // Find the role ID
      const roleResult = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        [mapping.roleName]
      );

      if (roleResult.rows.length === 0) {
        console.log(`⚠️  Role '${mapping.roleName}' not found, skipping...`);
        continue;
      }

      const roleId = roleResult.rows[0].id;
      console.log(`✅ Found role ID: ${roleId}`);

      // Process each permission for this role
      for (const permissionName of mapping.permissionNames) {
        try {
          // Find the permission ID
          const permissionResult = await client.query(
            'SELECT id FROM permissions WHERE name = $1',
            [permissionName]
          );

          if (permissionResult.rows.length === 0) {
            console.log(`⚠️  Permission '${permissionName}' not found, skipping...`);
            continue;
          }

          const permissionId = permissionResult.rows[0].id;

          // Check if role-permission assignment already exists
          const existingResult = await client.query(
            'SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
            [roleId, permissionId]
          );

          if (existingResult.rows.length > 0) {
            console.log(`⏭️  Skipped: ${permissionName} (already assigned)`);
            skippedAssignments++;
            continue;
          }

          // Assign permission to role
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id, assigned_at)
             VALUES ($1, $2, NOW())`,
            [roleId, permissionId]
          );

          console.log(`✅ Assigned: ${permissionName}`);
          totalAssignments++;

        } catch (error) {
          console.error(`❌ Error assigning ${permissionName}: ${error.message}`);
          throw error;
        }
      }
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Role-permission assignment completed!`);
    console.log(`✅ New assignments: ${totalAssignments}`);
    console.log(`⏭️  Skipped assignments: ${skippedAssignments}`);
    console.log(`📊 Total role-permission mappings processed: ${ROLE_PERMISSION_MAPPINGS.length}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error assigning role permissions: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the assignment if this file is executed directly
if (require.main === module) {
  assignRolePermissions();
}

export { assignRolePermissions }; 