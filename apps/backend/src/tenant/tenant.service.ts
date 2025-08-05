import { Injectable, ForbiddenException, NotFoundException, ConflictException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { RbacService } from '../rbac/rbac.service';
import { DatabaseService } from '../../database/database.service';
import { CreateTenantDto } from './dto/create-tenant.dto' ;
import { RoleService } from '../role/role.service';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly rbacService: RbacService,
    @Inject(forwardRef(() => RoleService))
    private readonly roleService: RoleService,
  ) {}

  /**
   * Create a new tenant
   */
  async createTenant(adminId: string | null, data: { name: string; description?: string }) {
    // Check if user has permission to create tenants if adminId is provided
    if (adminId) {
      await this.rbacService.checkPermission(adminId, 'tenants', 'create');
    }

    const result = await this.prisma.query(
      `INSERT INTO tenants (name, description, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
      [data.name, data.description || null, true]
    );

    return result[0];
  }

  /**
   * Get all tenants (with pagination)
   */
  async getTenants(adminId: string, skip = 0, take = 10) {
    // Check if user has permission to read tenants
    await this.rbacService.checkPermission(adminId, 'tenants', 'read');

    const [tenants, countResult] = await Promise.all([
      this.prisma.query(`
        SELECT t.*, 
               COUNT(DISTINCT u.id) as user_count
        FROM tenants t
        LEFT JOIN users u ON t.id = u.tenant_id
        GROUP BY t.id
        ORDER BY t.name ASC
        LIMIT $1 OFFSET $2
      `, [take, skip]),
      this.prisma.query(`SELECT COUNT(*) as count FROM tenants`)
    ]);

    return {
      tenants: tenants.map(tenant => ({
        ...tenant,
        _count: {
          users: parseInt(tenant.user_count) || 0,
        }
      })),
      count: parseInt(countResult[0].count),
      skip,
      take,
    };
  }

  /**
   * Get all tenants with associated users (simplified format)
   */
  async getAllTenantsWithUsers(adminId: string) {
    // Check if user has permission to read tenants
    await this.rbacService.checkPermission(adminId, 'tenants', 'read');

    const tenants = await this.prisma.query(`
      SELECT t.id as tenant_id, t.name as tenant_name,
             json_agg(
               json_build_object(
                 'id', u.id,
                 'name', u.name,
                 'email', u.email
               )
             ) FILTER (WHERE u.id IS NOT NULL) as users
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      GROUP BY t.id, t.name
      ORDER BY t.name ASC
    `);

    return tenants.map(tenant => ({
      tenantId: tenant.tenant_id,
      tenantName: tenant.tenant_name,
      users: tenant.users || [],
    }));
  }

  /**
   * Get a single tenant by ID
   */
  async getTenant(adminId: string, tenantId: string) {
    // Check if user has permission to read tenants
    await this.rbacService.checkPermission(adminId, 'tenants', 'read');

    const result = await this.prisma.query(`
      SELECT t.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT r.id) as role_count
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN roles r ON t.id = r.tenant_id
      WHERE t.id = $1
      GROUP BY t.id
    `, [tenantId]);

    if (result.length === 0) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    const tenant = result[0];
    return {
      ...tenant,
      _count: {
        users: parseInt(tenant.user_count) || 0,
        roles: parseInt(tenant.role_count) || 0,
      }
    };
  }

  /**
   * Get tenant details with associated users
   */
  async getTenantWithUsers(adminId: string, tenantId: string) {
    // Check if user has permission to read tenants
    await this.rbacService.checkPermission(adminId, 'tenants', 'read');

    const result = await this.prisma.query(`
      SELECT t.*,
             json_agg(
               json_build_object(
                 'id', u.id,
                 'name', u.name,
                 'email', u.email
               )
             ) FILTER (WHERE u.id IS NOT NULL) as users
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      WHERE t.id = $1
      GROUP BY t.id
    `, [tenantId]);

    if (result.length === 0) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    const tenant = result[0];
    const users = tenant.users || [];

    return {
      id: tenant.id,
      name: tenant.name,
      description: tenant.description,
      isActive: tenant.is_active,
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
      users: users,
      userCount: users.length,
    };
  }

  /**
   * Update a tenant
   */
  async updateTenant(
    adminId: string,
    tenantId: string,
    data: { name?: string; description?: string; isActive?: boolean },
  ) {
    // Check if user has permission to update tenants
    await this.rbacService.checkPermission(adminId, 'tenants', 'update');

    const tenant = await this.prisma.query(
      `SELECT * FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenant.length === 0) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(data.name);
    }

    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(data.description);
    }

    if (data.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(data.isActive);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(tenantId);

    const result = await this.prisma.query(
      `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    return result[0];
  }

  /**
   * Add a user to a tenant
   */
  async addUserToTenant(adminId: string, userId: string, tenantId: string) {
    // Check if user has permission to manage tenant users
    await this.rbacService.checkPermission(adminId, 'tenant-users', 'create');

    const [tenant, user] = await Promise.all([
      this.prisma.query(`SELECT * FROM tenants WHERE id = $1`, [tenantId]),
      this.prisma.query(`SELECT * FROM users WHERE id = $1`, [userId]),
    ]);

    if (tenant.length === 0) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    if (user.length === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const result = await this.prisma.query(
      `UPDATE users SET tenant_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [tenantId, userId]
    );

    return result[0];
  }

  /**
   * Remove a user from a tenant
   */
  async removeUserFromTenant(adminId: string, userId: string, tenantId: string) {
    // Check if user has permission to manage tenant users
    await this.rbacService.checkPermission(adminId, 'tenant-users', 'delete');

    const user = await this.prisma.query(
      `SELECT u.*, t.id as tenant_id FROM users u 
       LEFT JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.id = $1`,
      [userId]
    );

    if (user.length === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user[0].tenant_id || user[0].tenant_id !== tenantId) {
      throw new ForbiddenException(`User with ID ${userId} is not in tenant ${tenantId}`);
    }

    // Find the default tenant to move the user to
    const defaultTenant = await this.prisma.query(
      `SELECT * FROM tenants WHERE name = 'Default' LIMIT 1`
    );

    if (defaultTenant.length === 0) {
      throw new InternalServerErrorException('Default tenant not found');
    }

    const result = await this.prisma.query(
      `UPDATE users SET tenant_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [defaultTenant[0].id, userId]
    );

    return result[0];
  }

  /**
   * Create tenant with admin - complete setup
   */
  async createTenantWithAdmin(
    adminId: string | null,
    tenantData: { name: string; description?: string },
    AdminData: {
      name: string;
      email: string;
      password: string;
      phoneNumber?: string;
    }
  ) {
    // Check if tenant name already exists
    const existingTenant = await this.prisma.query(
      `SELECT * FROM tenants WHERE name = $1`,
      [tenantData.name]
    );

    if (existingTenant.length > 0) {
      throw new ConflictException('A tenant with this name already exists');
    }

    // Check if user email already exists
    const existingUser = await this.prisma.query(
      `SELECT * FROM users WHERE email = $1`,
      [AdminData.email]
    );

    if (existingUser.length > 0) {
      throw new ConflictException('A user with this email already exists');
    }

    try {
      // Create the tenant first
      const tenantResult = await this.prisma.query(
        `INSERT INTO tenants (name, description, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
        [tenantData.name, tenantData.description || `${tenantData.name} organization`, true]
      );

      const tenant = tenantResult[0];

      // Create admin with all permissions and roles for this tenant
      const AdminResult = await this.roleService.createTenantAdmin(
        tenant.id,
        AdminData
      );

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          description: tenant.description,
          isActive: tenant.is_active,
          createdAt: tenant.created_at,
          updatedAt: tenant.updated_at
        },
        Admin: AdminResult.user,
        setup: {
          permissionsCreated: AdminResult.permissions,
          role: AdminResult.role,
          message: 'Tenant created successfully with admin and full permission setup'
        }
      };
    } catch (error) {
      // If there's an error and tenant was created, we might want to clean up
      // For now, let the error bubble up
      throw error;
    }
  }
} 