import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SiteResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  SiteFilterDto,
} from '../dto';

@Injectable()
export class SitesService {
  private readonly logger = new Logger(SitesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    createSiteDto: CreateSiteDto,
    userId: string,
    tenantId: string,
  ): Promise<SiteResponseDto> {
    try {
      // Check if site with same name already exists in the tenant
      const existingSite = await this.databaseService.query(
        'SELECT id FROM sites WHERE name = $1 AND tenant_id = $2 AND is_active = true',
        [createSiteDto.name, tenantId],
      );

      if (existingSite.rows.length > 0) {
        throw new ConflictException('Site with this name already exists');
      }

      // Validate site type exists
      const siteType = await this.databaseService.query(
        'SELECT id FROM site_types WHERE id = $1 AND is_active = true',
        [createSiteDto.siteTypeId],
      );

      if (siteType.rows.length === 0) {
        throw new NotFoundException('Site type not found');
      }

      // Validate region if provided
      if (createSiteDto.regionId) {
        const region = await this.databaseService.query(
          'SELECT id FROM regions WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createSiteDto.regionId, tenantId],
        );

        if (region.rows.length === 0) {
          throw new NotFoundException('Region not found');
        }
      }

      // Validate zone if provided
      if (createSiteDto.zoneId) {
        const zone = await this.databaseService.query(
          'SELECT id FROM zones WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createSiteDto.zoneId, tenantId],
        );

        if (zone.rows.length === 0) {
          throw new NotFoundException('Zone not found');
        }
      }

      // Validate ward if provided
      if (createSiteDto.wardId) {
        const ward = await this.databaseService.query(
          'SELECT id FROM wards WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createSiteDto.wardId, tenantId],
        );

        if (ward.rows.length === 0) {
          throw new NotFoundException('Ward not found');
        }
      }

      // Validate supervisor if provided
      if (createSiteDto.supervisorId) {
        const supervisor = await this.databaseService.query(
          'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createSiteDto.supervisorId, tenantId],
        );

        if (supervisor.rows.length === 0) {
          throw new NotFoundException('Supervisor not found');
        }
      }

      const result = await this.databaseService.query(
        `INSERT INTO sites (
          name, site_type_id, status, region_id, zone_id, ward_id, 
          capacity_tons, current_load_tons, supervisor_id, address, 
          image_url, tenant_id, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          createSiteDto.name,
          createSiteDto.siteTypeId,
          createSiteDto.status,
          createSiteDto.regionId,
          createSiteDto.zoneId,
          createSiteDto.wardId,
          createSiteDto.capacityTons,
          createSiteDto.currentLoadTons || 0,
          createSiteDto.supervisorId,
          createSiteDto.address,
          createSiteDto.imageUrl,
          tenantId,
          userId,
        ],
      );

      const site = result.rows[0];
      this.logger.log(`Site created: ${site.id}`);

      return this.mapToResponseDto(site);
    } catch (error) {
      this.logger.error(`Error creating site: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto: SiteFilterDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<SiteResponseDto>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = paginationDto;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const whereConditions = ['s.tenant_id = $1'];
      const queryParams = [tenantId];
      let paramIndex = 2;

      if (filterDto.isActive !== undefined) {
        whereConditions.push(`s.is_active = $${paramIndex}`);
        queryParams.push(filterDto.isActive.toString());
        paramIndex++;
      }

      if (filterDto.status) {
        whereConditions.push(`s.status = $${paramIndex}`);
        queryParams.push(filterDto.status);
        paramIndex++;
      }

      if (filterDto.regionId) {
        whereConditions.push(`s.region_id = $${paramIndex}`);
        queryParams.push(filterDto.regionId);
        paramIndex++;
      }

      if (filterDto.zoneId) {
        whereConditions.push(`s.zone_id = $${paramIndex}`);
        queryParams.push(filterDto.zoneId);
        paramIndex++;
      }

      if (filterDto.wardId) {
        whereConditions.push(`s.ward_id = $${paramIndex}`);
        queryParams.push(filterDto.wardId);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(
          `(s.name ILIKE $${paramIndex} OR s.address ILIKE $${paramIndex})`,
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sites s
        ${whereClause}
      `;
      const countResult = await this.databaseService.query(
        countQuery,
        queryParams,
      );
      const total = parseInt(countResult.rows[0].total);

      const limitParamIndex = paramIndex;
      const offsetParamIndex = paramIndex + 1;
      
      // Get paginated data with joins
      const dataQuery = `
        SELECT 
          s.*,
          st.name as site_type_name,
          r.name as region_name,
          z.name as zone_name,
          w.name as ward_name,
          u.first_name || ' ' || u.last_name as supervisor_name,
          COALESCE(devices_count.count, 0) as devices_count,
          COALESCE(workforce_count.count, 0) as workforce_count
        FROM sites s
        LEFT JOIN site_types st ON s.site_type_id = st.id
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN zones z ON s.zone_id = z.id
        LEFT JOIN wards w ON s.ward_id = w.id
        LEFT JOIN users u ON s.supervisor_id = u.id
        LEFT JOIN (
          SELECT n.site_id, COUNT(*) as count 
          FROM devices d
          JOIN nodes n ON d.node_id = n.id
          WHERE d.is_active = true 
          GROUP BY n.site_id
        ) devices_count ON s.id = devices_count.site_id
        LEFT JOIN (
          SELECT site_id, COUNT(*) as count 
          FROM workforce_sites 
          GROUP BY site_id
        ) workforce_count ON s.id = workforce_count.site_id
        ${whereClause}
        ORDER BY s.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
      `;

      const dataResult = await this.databaseService.query(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const sites = dataResult.rows.map((row) => this.mapToResponseDto(row));

      return {
        data: sites,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error(`Error fetching sites: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, tenantId: string): Promise<SiteResponseDto> {
    try {
      const result = await this.databaseService.query(
        `SELECT 
          s.*,
          st.name as site_type_name,
          r.name as region_name,
          z.name as zone_name,
          w.name as ward_name,
          u.first_name || ' ' || u.last_name as supervisor_name,
          COALESCE(devices_count.count, 0) as devices_count,
          COALESCE(workforce_count.count, 0) as workforce_count
        FROM sites s
        LEFT JOIN site_types st ON s.site_type_id = st.id
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN zones z ON s.zone_id = z.id
        LEFT JOIN wards w ON s.ward_id = w.id
        LEFT JOIN users u ON s.supervisor_id = u.id
        LEFT JOIN (
          SELECT n.site_id, COUNT(*) as count 
          FROM devices d
          JOIN nodes n ON d.node_id = n.id
          WHERE d.is_active = true 
          GROUP BY n.site_id
        ) devices_count ON s.id = devices_count.site_id
        LEFT JOIN (
          SELECT site_id, COUNT(*) as count 
          FROM workforce_sites 
          GROUP BY site_id
        ) workforce_count ON s.id = workforce_count.site_id
        WHERE s.id = $1 AND s.tenant_id = $2`,
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Site not found');
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error fetching site ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateSiteDto: UpdateSiteDto,
    userId: string,
    tenantId: string,
  ): Promise<SiteResponseDto> {
    try {
      // Check if site exists
      const existingSite = await this.findOne(id, tenantId);

      // Check if name is being updated and if it conflicts with existing site
      if (updateSiteDto.name && updateSiteDto.name !== existingSite.name) {
        const nameConflict = await this.databaseService.query(
          'SELECT id FROM sites WHERE name = $1 AND tenant_id = $2 AND id != $3 AND is_active = true',
          [updateSiteDto.name, tenantId, id],
        );

        if (nameConflict.rows.length > 0) {
          throw new ConflictException('Site with this name already exists');
        }
      }

      // Validate site type if being updated
      if (updateSiteDto.siteTypeId) {
        const siteType = await this.databaseService.query(
          'SELECT id FROM site_types WHERE id = $1 AND is_active = true',
          [updateSiteDto.siteTypeId],
        );

        if (siteType.rows.length === 0) {
          throw new NotFoundException('Site type not found');
        }
      }

      // Validate region if being updated
      if (updateSiteDto.regionId) {
        const region = await this.databaseService.query(
          'SELECT id FROM regions WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateSiteDto.regionId, tenantId],
        );

        if (region.rows.length === 0) {
          throw new NotFoundException('Region not found');
        }
      }

      // Validate zone if being updated
      if (updateSiteDto.zoneId) {
        const zone = await this.databaseService.query(
          'SELECT id FROM zones WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateSiteDto.zoneId, tenantId],
        );

        if (zone.rows.length === 0) {
          throw new NotFoundException('Zone not found');
        }
      }

      // Validate ward if being updated
      if (updateSiteDto.wardId) {
        const ward = await this.databaseService.query(
          'SELECT id FROM wards WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateSiteDto.wardId, tenantId],
        );

        if (ward.rows.length === 0) {
          throw new NotFoundException('Ward not found');
        }
      }

      // Validate supervisor if being updated
      if (updateSiteDto.supervisorId) {
        const supervisor = await this.databaseService.query(
          'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateSiteDto.supervisorId, tenantId],
        );

        if (supervisor.rows.length === 0) {
          throw new NotFoundException('Supervisor not found');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (updateSiteDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        queryParams.push(updateSiteDto.name);
        paramIndex++;
      }

      if (updateSiteDto.siteTypeId !== undefined) {
        updateFields.push(`site_type_id = $${paramIndex}`);
        queryParams.push(updateSiteDto.siteTypeId);
        paramIndex++;
      }

      if (updateSiteDto.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        queryParams.push(updateSiteDto.status);
        paramIndex++;
      }

      if (updateSiteDto.regionId !== undefined) {
        updateFields.push(`region_id = $${paramIndex}`);
        queryParams.push(updateSiteDto.regionId);
        paramIndex++;
      }

      if (updateSiteDto.zoneId !== undefined) {
        updateFields.push(`zone_id = $${paramIndex}`);
        queryParams.push(updateSiteDto.zoneId);
        paramIndex++;
      }

      if (updateSiteDto.wardId !== undefined) {
        updateFields.push(`ward_id = $${paramIndex}`);
        queryParams.push(updateSiteDto.wardId);
        paramIndex++;
      }

      if (updateSiteDto.capacityTons !== undefined) {
        updateFields.push(`capacity_tons = $${paramIndex}`);
        queryParams.push(updateSiteDto.capacityTons);
        paramIndex++;
      }

      if (updateSiteDto.currentLoadTons !== undefined) {
        updateFields.push(`current_load_tons = $${paramIndex}`);
        queryParams.push(updateSiteDto.currentLoadTons);
        paramIndex++;
      }

      if (updateSiteDto.supervisorId !== undefined) {
        updateFields.push(`supervisor_id = $${paramIndex}`);
        queryParams.push(updateSiteDto.supervisorId);
        paramIndex++;
      }

      if (updateSiteDto.address !== undefined) {
        updateFields.push(`address = $${paramIndex}`);
        queryParams.push(updateSiteDto.address);
        paramIndex++;
      }

      if (updateSiteDto.imageUrl !== undefined) {
        updateFields.push(`image_url = $${paramIndex}`);
        queryParams.push(updateSiteDto.imageUrl);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return existingSite;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await this.databaseService.query(
        `UPDATE sites 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
         RETURNING *`,
        [...queryParams, id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Site not found');
      }

      this.logger.log(`Site updated: ${id}`);
      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating site ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    try {
      // Check if site has any active devices
      const devicesResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM devices WHERE site_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(devicesResult.rows[0].count) > 0) {
        throw new ConflictException('Cannot delete site with active devices');
      }

      // Check if site has any assigned workforce
      const workforceResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM workforce_sites WHERE site_id = $1',
        [id],
      );

      if (parseInt(workforceResult.rows[0].count) > 0) {
        throw new ConflictException(
          'Cannot delete site with assigned workforce',
        );
      }

      const result = await this.databaseService.query(
        'DELETE FROM sites WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Site not found');
      }

      this.logger.log(`Site deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting site ${id}: ${error.message}`);
      throw error;
    }
  }

  private mapToResponseDto(site: any): SiteResponseDto {
    return {
      id: site.id,
      name: site.name,
      siteTypeId: site.site_type_id,
      siteTypeName: site.site_type_name,
      status: site.status,
      regionId: site.region_id,
      regionName: site.region_name,
      zoneId: site.zone_id,
      zoneName: site.zone_name,
      wardId: site.ward_id,
      wardName: site.ward_name,
      capacityTons: site.capacity_tons,
      currentLoadTons: site.current_load_tons,
      supervisorId: site.supervisor_id,
      supervisorName: site.supervisor_name,
      address: site.address,
      imageUrl: site.image_url,
      isActive: site.is_active,
      tenantId: site.tenant_id,
      createdBy: site.created_by,
      createdAt: site.created_at,
      updatedAt: site.updated_at,
      devicesCount: parseInt(site.devices_count) || 0,
      workforceCount: parseInt(site.workforce_count) || 0,
    };
  }
}
