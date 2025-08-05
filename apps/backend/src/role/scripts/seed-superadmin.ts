import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DatabaseService } from '../../../database/database.service';
import { Logger } from '@nestjs/common';

interface PermissionResult {
  permission_id: string;
  permission_name: string;
}

interface RoleWithPermissions {
  id: string;
  name: string;
  tenant_id: string | null;
  current_permissions: PermissionResult[];
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

class RolePermissionSeeder {
  private readonly logger = new Logger(RolePermissionSeeder.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Seed ADMIN permissions to Admin role
   */
  async seedAdminPermissions(): Promise<void> {
    try {
      this.logger.log('Starting to seed ADMIN permissions to Admin role...');

      // Get the Admin role
      const adminRoleResult = await this.database.query(
        `SELECT r.*, 
                COALESCE(
                  json_agg(
                    json_build_object(
                      'permission_id', rp.permission_id,
                      'permission_name', p.name
                    )
                  ) FILTER (WHERE rp.permission_id IS NOT NULL), 
                  '[]'::json
                ) as current_permissions
         FROM roles r
         LEFT JOIN role_permissions rp ON r.id = rp.role_id
         LEFT JOIN permissions p ON rp.permission_id = p.id
         WHERE r.name = $1 AND r.tenant_id IS NULL
         GROUP BY r.id`,
        ['Admin']
      );

      const adminRole: RoleWithPermissions = adminRoleResult[0];

      if (!adminRole) {
        this.logger.error('Admin role not found. Please create the Admin role first.');
        return;
      }

      const currentPermissions = Array.isArray(adminRole.current_permissions) 
        ? adminRole.current_permissions 
        : [];

      this.logger.log(`Found Admin role with ${currentPermissions.length} existing permissions`);

      // Get all ADMIN and BOTH type permissions (system-level only)
      const adminPermissionsResult = await this.database.query(
        `SELECT id, name, resource, action 
         FROM permissions 
         WHERE tenant_id IS NULL 
         AND (
           -- Get permissions that should be assigned to ADMIN
           name LIKE 'MANAGE_%' OR 
           name LIKE 'VIEW_ALL_%' OR
           name LIKE '%_SYSTEM_%' OR
           name LIKE 'CREATE_%' OR
           name LIKE 'UPDATE_%' OR
           name LIKE 'DELETE_%' OR
           name LIKE 'BACKUP_%' OR
           name LIKE 'RESTORE_%' OR
           name = 'ACCESS_SYSTEM' OR
           
         )
         ORDER BY name`,
        []
      );
      
      const adminPermissions: Permission[] = adminPermissionsResult.rows;

      this.logger.log(`Found ${adminPermissions.length} total admin-type permissions`);

      // Get currently assigned permission IDs
      const currentPermissionIds = new Set(
        currentPermissions.map(cp => cp.permission_id)
      );

      // Filter out permissions that are already assigned
      const permissionsToAssign = adminPermissions.filter(permission => 
        !currentPermissionIds.has(permission.id)
      );

      if (permissionsToAssign.length === 0) {
        this.logger.log('Admin already has all available admin permissions assigned');
        return;
      }

      this.logger.log(`Need to assign ${permissionsToAssign.length} new permissions to Admin`);

      // Create role-permission relationships for new permissions
      for (const permission of permissionsToAssign) {
        await this.database.query(
          `INSERT INTO role_permissions (role_id, permission_id, assigned_at) 
           VALUES ($1, $2, NOW())`,
          [adminRole.id, permission.id]
        );
        
        this.logger.log(`Assigned permission: ${permission.name} (${permission.resource}:${permission.action})`);
      }

      this.logger.log(`Successfully assigned ${permissionsToAssign.length} new permissions to Admin role`);

      // Display final summary
      const finalCount = await this.database.query(
        `SELECT COUNT(*) as total_permissions
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = $1 AND p.tenant_id IS NULL`,
        [adminRole.id]
      );

      this.logger.log(`Admin now has ${finalCount[0].total_permissions} total system permissions`);

    } catch (error) {
      this.logger.error('Error seeding permissions to Admin:', error);
      throw error;
    }
  }

  /**
   * Seed END_USER permissions to User role
   */
  async seedEndUserPermissions(): Promise<void> {
    try {
      this.logger.log('Starting to seed END_USER permissions to User role...');

      const userRoleResult = await this.database.query(
        `SELECT id, name FROM roles WHERE name = $1 AND tenant_id IS NULL`,
        ['User']
      );

      if (userRoleResult.rows.length === 0) {
        this.logger.error('User role not found. Please create the User role first.');
        return;
      }

      const userRole = userRoleResult.rows[0];

      // Get all END_USER type permissions
      const endUserPermissionsResult = await this.database.query(
        `SELECT p.id, p.name, p.resource, p.action
         FROM permissions p
         WHERE p.tenant_id IS NULL
         AND (
           -- Get permissions that should be assigned to END_USER
           p.name LIKE 'VIEW_OWN_%' OR
           p.name LIKE 'UPDATE_OWN_%' OR
           p.name LIKE 'CREATE_OWN_%' OR
           p.name LIKE 'CHANGE_OWN_%' OR
           p.name LIKE 'VIEW_ASSIGNED_%' OR
           p.name LIKE 'CUSTOMIZE_OWN_%' OR
           p.name LIKE 'EXPORT_OWN_%' OR
           p.name LIKE 'MANAGE_OWN_%' OR
           p.name = 'ACCESS_SYSTEM' OR
           p.name = 'VIEW_BASIC_DASHBOARD'
         )
         AND NOT EXISTS (
           SELECT 1 FROM role_permissions rp 
           WHERE rp.role_id = $1 AND rp.permission_id = p.id
         )`,
        [userRole.id]
      );
      
      const endUserPermissions: Permission[] = endUserPermissionsResult.rows;

      this.logger.log(`Found ${endUserPermissions.length} end-user permissions to assign`);

      for (const permission of endUserPermissions) {
        await this.database.query(
          `INSERT INTO role_permissions (role_id, permission_id, assigned_at) 
           VALUES ($1, $2, NOW())`,
          [userRole.id, permission.id]
        );
        
        this.logger.log(`Assigned end-user permission: ${permission.name}`);
      }

      this.logger.log(`Successfully assigned ${endUserPermissions.length} permissions to User role`);

    } catch (error) {
      this.logger.error('Error seeding end-user permissions:', error);
      throw error;
    }
  }

  /**
   * Seed all role permissions
   */
  async seedAllRolePermissions(): Promise<void> {
    try {
      this.logger.log('🚀 Starting role permission seeding process...');
      
      await this.seedAdminPermissions();
      await this.seedEndUserPermissions();
      
      this.logger.log('✅ All role permissions seeded successfully!');
    } catch (error) {
      this.logger.error('❌ Error during role permission seeding:', error);
      throw error;
    }
  }
}

/**
 * Main seeding function
 */
async function seedRolePermissions(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const database = app.get(DatabaseService);
    const seeder = new RolePermissionSeeder(database);
    
    await seeder.seedAllRolePermissions();
    
  } catch (error) {
    console.error('Failed to seed role permissions:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the script if called directly
if (require.main === module) {
  seedRolePermissions()
    .then(() => {
      console.log('Role permission seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Role permission seeding failed:', error);
      process.exit(1);
    });
}

export { seedRolePermissions, RolePermissionSeeder };