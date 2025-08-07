import { DatabaseService } from '../../../database/database.service';
import { PREDEFINED_PERMISSIONS } from '../config/predefined-permissions';

async function seedGlobalPermissions() {
  console.log('Starting global permissions seeding...');

  try {
    // Create database service directly
    const databaseService = new DatabaseService();

    for (const permission of PREDEFINED_PERMISSIONS) {
      // Only create global permissions (not tenant-specific)
      if (
        permission.userType === 'ADMIN' ||
        permission.userType === 'END_USER'
      ) {
        await createGlobalPermission(databaseService, permission);
      }
    }

    console.log('Global permissions seeded successfully!');
  } catch (error) {
    console.error(`Error seeding global permissions: ${error.message}`);
    process.exit(1);
  }
}

async function createGlobalPermission(
  databaseService: DatabaseService,
  permission: {
    name: string;
    resource: string;
    action: string;
    description: string;
  },
) {
  try {
    // Check if global permission already exists
    const existingPermission = await databaseService.query(
      `SELECT id FROM permissions 
       WHERE resource = $1 AND action = $2 AND tenant_id IS NULL`,
      [permission.resource, permission.action],
    );

    if (existingPermission.rows.length > 0) {
      console.log(`Global permission ${permission.name} already exists`);
      return existingPermission.rows[0];
    }

    // Create global permission
    const result = await databaseService.query(
      `INSERT INTO permissions (name, resource, action, description, tenant_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NULL, NOW(), NOW()) RETURNING *`,
      [
        permission.name,
        permission.resource,
        permission.action,
        permission.description,
      ],
    );

    console.log(`Created global permission: ${permission.name}`);
    return result.rows[0];
  } catch (error) {
    console.error(
      `Error creating global permission ${permission.name}: ${error.message}`,
    );
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedGlobalPermissions();
}

export { seedGlobalPermissions };
