import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  CreateZoneDto,
  UpdateZoneDto,
  ZoneResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';

@Injectable()
export class ZonesService {
  private readonly logger = new Logger(ZonesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    createZoneDto: CreateZoneDto,
    userId: string,
    tenantId: string,
  ): Promise<ZoneResponseDto> {
    try {
      // Check if zone with same name already exists in the region
      const existingZone = await this.databaseService.query(
        'SELECT id FROM zones WHERE name = $1 AND region_id = $2 AND tenant_id = $3 AND is_active = true',
        [createZoneDto.name, createZoneDto.regionId, tenantId],
      );

      if (existingZone.rows.length > 0) {
        throw new ConflictException(
          'Zone with this name already exists in this region',
        );
      }

      // Validate region exists and belongs to tenant
      const region = await this.databaseService.query(
        'SELECT id FROM regions WHERE id = $1 AND tenant_id = $2 AND is_active = true',
        [createZoneDto.regionId, tenantId],
      );

      if (region.rows.length === 0) {
        throw new NotFoundException('Region not found');
      }

      const result = await this.databaseService.query(
        `INSERT INTO zones (name, description, region_id, is_active, tenant_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          createZoneDto.name,
          createZoneDto.description,
          createZoneDto.regionId,
          createZoneDto.isActive ?? true,
          tenantId,
          userId,
        ],
      );

      const zone = result.rows[0];
      this.logger.log(`Zone created: ${zone.id}`);

      return this.mapToResponseDto(zone);
    } catch (error) {
      this.logger.error(`Error creating zone: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto: BaseFilterDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<ZoneResponseDto>> {
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
      const whereConditions = ['z.tenant_id = $1'];
      const queryParams = [tenantId];
      let paramIndex = 2;

      if (filterDto.isActive !== undefined) {
        whereConditions.push(`z.is_active = $${paramIndex}`);
        queryParams.push(filterDto.isActive.toString());
        paramIndex++;
      }

      if (filterDto.regionId) {
        whereConditions.push(`z.region_id = $${paramIndex}`);
        queryParams.push(filterDto.regionId);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(
          `(z.name ILIKE $${paramIndex} OR z.description ILIKE $${paramIndex})`,
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
        FROM zones z
        ${whereClause}
      `;
      const countResult = await this.databaseService.query(
        countQuery,
        queryParams,
      );
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with counts
      const dataQuery = `
        SELECT 
          z.*,
          r.name as region_name,
          COALESCE(wards_count.count, 0) as wards_count,
          COALESCE(sites_count.count, 0) as sites_count,
          COALESCE(vehicles_count.count, 0) as vehicles_count
        FROM zones z
        LEFT JOIN regions r ON z.region_id = r.id
        LEFT JOIN (
          SELECT zone_id, COUNT(*) as count 
          FROM wards 
          WHERE is_active = true 
          GROUP BY zone_id
        ) wards_count ON z.id = wards_count.zone_id
        LEFT JOIN (
          SELECT zone_id, COUNT(*) as count 
          FROM sites 
          WHERE is_active = true 
          GROUP BY zone_id
        ) sites_count ON z.id = sites_count.zone_id
        LEFT JOIN (
          SELECT assigned_zone_id, COUNT(*) as count 
          FROM vehicles 
          WHERE is_active = true 
          GROUP BY assigned_zone_id
        ) vehicles_count ON z.id = vehicles_count.assigned_zone_id
        ${whereClause}
        ORDER BY z.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataResult = await this.databaseService.query(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const zones = dataResult.rows.map((row) => this.mapToResponseDto(row));

      return {
        data: zones,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error(`Error fetching zones: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, tenantId: string): Promise<ZoneResponseDto> {
    try {
      const result = await this.databaseService.query(
        `SELECT 
          z.*,
          r.name as region_name,
          COALESCE(wards_count.count, 0) as wards_count,
          COALESCE(sites_count.count, 0) as sites_count,
          COALESCE(vehicles_count.count, 0) as vehicles_count
        FROM zones z
        LEFT JOIN regions r ON z.region_id = r.id
        LEFT JOIN (
          SELECT zone_id, COUNT(*) as count 
          FROM wards 
          WHERE is_active = true 
          GROUP BY zone_id
        ) wards_count ON z.id = wards_count.zone_id
        LEFT JOIN (
          SELECT zone_id, COUNT(*) as count 
          FROM sites 
          WHERE is_active = true 
          GROUP BY zone_id
        ) sites_count ON z.id = sites_count.zone_id
        LEFT JOIN (
          SELECT assigned_zone_id, COUNT(*) as count 
          FROM vehicles 
          WHERE is_active = true 
          GROUP BY assigned_zone_id
        ) vehicles_count ON z.id = vehicles_count.assigned_zone_id
        WHERE z.id = $1 AND z.tenant_id = $2`,
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Zone not found');
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error fetching zone ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateZoneDto: UpdateZoneDto,
    userId: string,
    tenantId: string,
  ): Promise<ZoneResponseDto> {
    try {
      // Check if zone exists
      const existingZone = await this.findOne(id, tenantId);

      // Check if name is being updated and if it conflicts with existing zone in the same region
      if (updateZoneDto.name && updateZoneDto.name !== existingZone.name) {
        const nameConflict = await this.databaseService.query(
          'SELECT id FROM zones WHERE name = $1 AND region_id = $2 AND tenant_id = $3 AND id != $4 AND is_active = true',
          [updateZoneDto.name, existingZone.regionId, tenantId, id],
        );

        if (nameConflict.rows.length > 0) {
          throw new ConflictException(
            'Zone with this name already exists in this region',
          );
        }
      }

      // Validate region if being updated
      if (updateZoneDto.regionId) {
        const region = await this.databaseService.query(
          'SELECT id FROM regions WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateZoneDto.regionId, tenantId],
        );

        if (region.rows.length === 0) {
          throw new NotFoundException('Region not found');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (updateZoneDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        queryParams.push(updateZoneDto.name);
        paramIndex++;
      }

      if (updateZoneDto.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        queryParams.push(updateZoneDto.description);
        paramIndex++;
      }

      if (updateZoneDto.regionId !== undefined) {
        updateFields.push(`region_id = $${paramIndex}`);
        queryParams.push(updateZoneDto.regionId);
        paramIndex++;
      }

      if (updateZoneDto.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        queryParams.push(updateZoneDto.isActive);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return existingZone;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await this.databaseService.query(
        `UPDATE zones 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
         RETURNING *`,
        [...queryParams, id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Zone not found');
      }

      this.logger.log(`Zone updated: ${id}`);
      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating zone ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    try {
      // Check if zone has any active wards
      const wardsResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM wards WHERE zone_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(wardsResult.rows[0].count) > 0) {
        throw new ConflictException('Cannot delete zone with active wards');
      }

      // Check if zone has any active sites
      const sitesResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM sites WHERE zone_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(sitesResult.rows[0].count) > 0) {
        throw new ConflictException('Cannot delete zone with active sites');
      }

      // Check if zone has any assigned vehicles
      const vehiclesResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM vehicles WHERE assigned_zone_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(vehiclesResult.rows[0].count) > 0) {
        throw new ConflictException(
          'Cannot delete zone with assigned vehicles',
        );
      }

      const result = await this.databaseService.query(
        'DELETE FROM zones WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Zone not found');
      }

      this.logger.log(`Zone deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting zone ${id}: ${error.message}`);
      throw error;
    }
  }

  private mapToResponseDto(zone: any): ZoneResponseDto {
    return {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      regionId: zone.region_id,
      regionName: zone.region_name,
      isActive: zone.is_active,
      tenantId: zone.tenant_id,
      createdBy: zone.created_by,
      createdAt: zone.created_at,
      updatedAt: zone.updated_at,
      wardsCount: parseInt(zone.wards_count) || 0,
      sitesCount: parseInt(zone.sites_count) || 0,
      vehiclesCount: parseInt(zone.vehicles_count) || 0,
    };
  }
}
