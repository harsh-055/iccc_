import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { PREDEFINED_PERMISSIONS } from '../config/predefined-permissions';

@Injectable()
export class GlobalPermissionsService {
  private readonly logger = new Logger(GlobalPermissionsService.name);

  constructor(private database: DatabaseService) {}

  /**
   * Seed all permissions from predefined list
   */
  async seedGlobalPermissions() {
    try {
      this.logger.log('Starting to seed all permissions from predefined list...');

      for (const permission of PREDEFINED_PERMISSIONS) {
        await this.createGlobalPermission(permission);
      }

      this.logger.log('All permissions seeded successfully');
    } catch (error) {
      this.logger.error(`Error seeding permissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Seed permissions by module
   */
  async seedPermissionsByModule(module: string) {
    try {
      this.logger.log(`Starting to seed permissions for module: ${module}`);

      const modulePermissions = PREDEFINED_PERMISSIONS.filter(
        (permission) => permission.module === module,
      );

      for (const permission of modulePermissions) {
        await this.createGlobalPermission(permission);
      }

      this.logger.log(`Permissions for module ${module} seeded successfully`);
    } catch (error) {
      this.logger.error(`Error seeding permissions for module ${module}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a global permission (tenant_id = NULL)
   */
  async createGlobalPermission(permission: {
    name: string;
    resource: string;
    action: string;
    description: string;
  }) {
    try {
      // Check if global permission already exists
      const existingPermission = await this.database.query(
        `SELECT id FROM permissions 
         WHERE resource = $1 AND action = $2 AND tenant_id IS NULL`,
        [permission.resource, permission.action],
      );

      if (existingPermission.rows.length > 0) {
        this.logger.debug(
          `Global permission ${permission.name} already exists`,
        );
        return existingPermission.rows[0];
      }

      // Create global permission
      const result = await this.database.query(
        `INSERT INTO permissions (name, resource, action, description, tenant_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, NULL, NOW(), NOW()) RETURNING *`,
        [
          permission.name,
          permission.resource,
          permission.action,
          permission.description,
        ],
      );

      this.logger.log(`Created global permission: ${permission.name}`);
      return result.rows[0];
    } catch (error) {
      this.logger.error(
        `Error creating global permission ${permission.name}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get all global permissions
   */
  async getGlobalPermissions() {
    return this.database.query(`
      SELECT * FROM permissions 
      WHERE tenant_id IS NULL 
      ORDER BY name ASC
    `);
  }

  /**
   * Check if a global permission exists
   */
  async globalPermissionExists(
    resource: string,
    action: string,
  ): Promise<boolean> {
    const result = await this.database.query(
      `SELECT id FROM permissions 
       WHERE resource = $1 AND action = $2 AND tenant_id IS NULL`,
      [resource, action],
    );
    return result.rows.length > 0;
  }
}
