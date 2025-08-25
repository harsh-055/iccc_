import { Client } from 'pg';
import { config } from 'dotenv';
import { PREDEFINED_PERMISSIONS } from '../config/predefined-permissions';

// Load environment variables
config();

async function seedPermissions() {
  console.log('🌱 Starting to seed all permissions from predefined list...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    await client.query('BEGIN');

    let seededCount = 0;
    let skippedCount = 0;

    for (const permission of PREDEFINED_PERMISSIONS) {
      try {
        // Check if permission already exists
        const existingResult = await client.query(
          'SELECT id FROM permissions WHERE name = $1',
          [permission.name]
        );

        if (existingResult.rows.length > 0) {
          console.log(`⏭️  Skipped: ${permission.name} (already exists)`);
          skippedCount++;
          continue;
        }

        // Insert new permission
        await client.query(
          `INSERT INTO permissions (name, resource, action, description, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [
            permission.name,
            permission.resource,
            permission.action,
            permission.description,
          ]
        );

        console.log(`✅ Seeded: ${permission.name}`);
        seededCount++;
      } catch (error) {
        console.error(`❌ Error seeding ${permission.name}: ${error.message}`);
        throw error;
      }
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Permission seeding completed!`);
    console.log(`✅ New permissions seeded: ${seededCount}`);
    console.log(`⏭️  Permissions skipped (already exist): ${skippedCount}`);
    console.log(`📊 Total permissions in predefined list: ${PREDEFINED_PERMISSIONS.length}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error seeding permissions: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedPermissions();
}

export { seedPermissions }; 