import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class DefaultRolesService implements OnModuleInit {
  private readonly logger = new Logger(DefaultRolesService.name);

  constructor(private database: DatabaseService) {}

  async onModuleInit() {
    // Since roles and permissions are seeded via SQL migrations,
    // we only need to ensure the Default tenant exists
    this.logger.log(
      'DefaultRolesService initialized - using SQL-seeded roles and permissions',
    );

    // Optionally ensure Default tenant exists with retry logic
    setTimeout(() => {
      this.ensureDefaultTenantWithRetry()
        .then(() => this.logger.log('✅ Default tenant check completed'))
        .catch((err) =>
          this.logger.error('❌ Error checking default tenant:', err),
        );
    }, 5000); // Increased delay for deployment to allow migrations to complete
  }

  private async ensureDefaultTenantWithRetry(maxRetries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `Attempting to ensure default tenant (attempt ${attempt}/${maxRetries})`,
        );

        // First, test database connection
        await this.database.query('SELECT 1');
        this.logger.log('Database connection verified');

        // Check if migrations table exists (indicates migrations have run)
        const migrationsTableExists = await this.database.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'migrations'
          );
        `);

        if (!migrationsTableExists.rows[0].exists) {
          this.logger.warn(
            '⚠️  Migrations table not found, waiting for migrations to complete...',
          );
          await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 more seconds
        }

        const result = await this.database.query(
          `SELECT * FROM tenants WHERE name = 'Default' LIMIT 1`,
        );

        if (!result || !result.rows || result.rows.length === 0) {
          await this.database.query(
            `INSERT INTO tenants (name, description, is_active, created_at, updated_at) 
             VALUES ('Default', 'Default system tenant', true, NOW(), NOW()) 
             ON CONFLICT (name) DO NOTHING`,
          );
          this.logger.log('Created Default tenant');
        } else {
          this.logger.log('Default tenant already exists');
        }

        return; // Success, exit the retry loop
      } catch (error) {
        this.logger.error(
          `Error ensuring default tenant (attempt ${attempt}/${maxRetries}):`,
          error,
        );

        if (attempt === maxRetries) {
          this.logger.error('Max retries reached for default tenant creation');
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async ensureDefaultTenant() {
    try {
      const result = await this.database.query(
        `SELECT * FROM tenants WHERE name = 'Default' LIMIT 1`,
      );

      if (!result || !result.rows || result.rows.length === 0) {
        await this.database.query(
          `INSERT INTO tenants (name, description, is_active, created_at, updated_at) 
           VALUES ('Default', 'Default system tenant', true, NOW(), NOW()) 
           ON CONFLICT (name) DO NOTHING`,
        );
        this.logger.log('Created Default tenant');
      }
    } catch (error) {
      this.logger.error('Error ensuring default tenant:', error);
    }
  }

  // Helper method to get role by name
  async getRoleByName(roleName: string) {
    try {
      const roleResult = await this.database.query(
        `SELECT r.*, 
                COALESCE(
                  json_agg(
                    json_build_object(
                      'permission_id', rp.permission_id,
                      'permission', json_build_object(
                        'id', p.id,
                        'name', p.name,
                        'resource', p.resource,
                        'action', p.action
                      )
                    )
                  ) FILTER (WHERE rp.permission_id IS NOT NULL), 
                  '[]'::json
                ) as permissions
         FROM roles r
         LEFT JOIN role_permissions rp ON r.id = rp.role_id
         LEFT JOIN permissions p ON rp.permission_id = p.id
         WHERE r.name = $1 
         GROUP BY r.id`,
        [roleName],
      );

      return (roleResult && roleResult.rows && roleResult.rows[0]) || null;
    } catch (error) {
      console.error(`Error getting ${roleName} role:`, error);
      return null;
    }
  }

  // Check if user has specific role
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const userResult = await this.database.query(
        `SELECT EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = $1 AND r.name = $2
        ) as has_role`,
        [userId, roleName],
      );

      return userResult?.rows?.[0]?.has_role || false;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  // Helper to check if user is super admin
  async isSuperAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'SUPER_ADMIN');
  }

  // Helper to check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'ADMIN');
  }
}
