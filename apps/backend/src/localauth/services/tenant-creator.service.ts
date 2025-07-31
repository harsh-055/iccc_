import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

interface Tenant {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

@Injectable()
export class TenantCreatorService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Create a new tenant during user signup
   */
  async createTenant(data: { name: string; description?: string; createdBy?: string }): Promise<Tenant> {
    const result = await this.databaseService.query<Tenant>(
      `INSERT INTO tenants (name, description, is_active, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        data.name, 
        data.description || null, 
        true,
        data.createdBy || null
      ]
    );

    return result.rows[0];
  }

  /**
   * Associate a user with a tenant
   * Note: Based on your schema, users are associated with tenants through user_roles table, 
   * not directly on the users table
   */
  async associateUserWithTenant(userId: string, tenantId: string, roleId?: string): Promise<void> {
    // If no roleId provided, get the default 'member' role for the tenant
    if (!roleId) {
      const roleResult = await this.databaseService.query(
        `SELECT id FROM roles 
         WHERE name = 'member' AND tenant_id = $1 
         LIMIT 1`,
        [tenantId]
      );

      if (roleResult.rows.length === 0) {
        // Create default member role if it doesn't exist
        const newRoleResult = await this.databaseService.query(
          `INSERT INTO roles (name, description, tenant_id, is_system)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          ['member', 'Default member role', tenantId, false]
        );
        roleId = newRoleResult.rows[0].id;
      } else {
        roleId = roleResult.rows[0].id;
      }
    }

    // Associate user with tenant through user_roles
    await this.databaseService.query(
      `INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING`,
      [userId, roleId, tenantId, userId] // assigned_by is the user themselves during signup
    );
  }

  /**
   * Alternative: If you want to add a tenant_id directly to users table 
   * (you would need to add this column to your users table first)
   */
  async updateUserTenant(userId: string, tenantId: string): Promise<void> {
    await this.databaseService.query(
      `UPDATE users SET tenant_id = $1 WHERE id = $2`,
      [tenantId, userId]
    );
  }
}