import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SiteService {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Create a new site
   */
  async create(adminId: string, createSiteDto: CreateSiteDto) {
    // Check if site name already exists in this tenant
    const existingSite = await this.database.query(
      `SELECT id FROM sites WHERE name = $1 AND tenant_id = $2`,
      [createSiteDto.name, createSiteDto.tenantId]
    );

    if (existingSite.length > 0) {
      throw new ConflictException(`Site with name "${createSiteDto.name}" already exists in this tenant`);
    }

    // Verify tenant exists
    const tenant = await this.database.query(
      `SELECT id FROM tenants WHERE id = $1`,
      [createSiteDto.tenantId]
    );

    if (tenant.length === 0) {
      throw new NotFoundException(`Tenant with ID "${createSiteDto.tenantId}" not found`);
    }

    const result = await this.database.query(
      `INSERT INTO sites (name, description, url, tenant_id, created_by, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [
        createSiteDto.name,
        createSiteDto.description || null,
        createSiteDto.url || null,
        createSiteDto.tenantId,
        adminId,
        true
      ]
    );

    return result[0];
  }

  /**
   * Get all sites for a tenant
   */
  async findByTenant(adminId: string, tenantId: string, skip = 0, take = 10) {
    const [sites, countResult] = await Promise.all([
      this.database.query(`
        SELECT s.*, u.name as created_by_name
        FROM sites s
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.tenant_id = $1
        ORDER BY s.name ASC
        LIMIT $2 OFFSET $3
      `, [tenantId, take, skip]),
      this.database.query(
        `SELECT COUNT(*) as count FROM sites WHERE tenant_id = $1`,
        [tenantId]
      )
    ]);

    return {
      sites,
      count: parseInt(countResult[0].count),
      skip,
      take,
    };
  }

  /**
   * Get a single site by ID
   */
  async findOne(adminId: string, siteId: string) {
    const result = await this.database.query(`
      SELECT s.*, u.name as created_by_name
      FROM sites s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1
    `, [siteId]);

    if (result.length === 0) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    return result[0];
  }

  /**
   * Update a site
   */
  async update(adminId: string, siteId: string, updateSiteDto: UpdateSiteDto) {
    const site = await this.database.query(
      `SELECT * FROM sites WHERE id = $1`,
      [siteId]
    );

    if (site.length === 0) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    // Check if new name conflicts with existing site in same tenant
    if (updateSiteDto.name && updateSiteDto.name !== site[0].name) {
      const existingSite = await this.database.query(
        `SELECT id FROM sites WHERE name = $1 AND tenant_id = $2 AND id != $3`,
        [updateSiteDto.name, site[0].tenant_id, siteId]
      );

      if (existingSite.length > 0) {
        throw new ConflictException(`Site with name "${updateSiteDto.name}" already exists in this tenant`);
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (updateSiteDto.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(updateSiteDto.name);
    }

    if (updateSiteDto.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updateSiteDto.description);
    }

    if (updateSiteDto.url !== undefined) {
      updateFields.push(`url = $${paramIndex++}`);
      updateValues.push(updateSiteDto.url);
    }

    if (updateSiteDto.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(updateSiteDto.isActive);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(siteId);

    const result = await this.database.query(
      `UPDATE sites SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    return result[0];
  }

  /**
   * Remove a site
   */
  async remove(adminId: string, siteId: string) {
    const site = await this.database.query(
      `SELECT * FROM sites WHERE id = $1`,
      [siteId]
    );

    if (site.length === 0) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    await this.database.query(
      `DELETE FROM sites WHERE id = $1`,
      [siteId]
    );

    return { message: 'Site deleted successfully' };
  }

  /**
   * Get all sites (admin only)
   */
  async findAll(adminId: string, skip = 0, take = 10) {
    const [sites, countResult] = await Promise.all([
      this.database.query(`
        SELECT s.*, t.name as tenant_name, u.name as created_by_name
        FROM sites s
        LEFT JOIN tenants t ON s.tenant_id = t.id
        LEFT JOIN users u ON s.created_by = u.id
        ORDER BY s.name ASC
        LIMIT $1 OFFSET $2
      `, [take, skip]),
      this.database.query(`SELECT COUNT(*) as count FROM sites`)
    ]);

    return {
      sites,
      count: parseInt(countResult[0].count),
      skip,
      take,
    };
  }
}
