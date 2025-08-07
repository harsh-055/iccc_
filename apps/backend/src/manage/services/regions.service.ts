import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  CreateRegionDto,
  UpdateRegionDto,
  RegionResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';

@Injectable()
export class RegionsService {
  private readonly logger = new Logger(RegionsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    createRegionDto: CreateRegionDto,
    userId: string,
    tenantId: string,
  ): Promise<RegionResponseDto> {
    try {
      // Check if region with same name already exists in the tenant
      const existingRegion = await this.databaseService.query(
        'SELECT id FROM regions WHERE name = $1 AND tenant_id = $2 AND is_active = true',
        [createRegionDto.name, tenantId],
      );

      if (existingRegion.rows.length > 0) {
        throw new ConflictException('Region with this name already exists');
      }

      const result = await this.databaseService.query(
        `INSERT INTO regions (name, description, is_active, tenant_id, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          createRegionDto.name,
          createRegionDto.description,
          createRegionDto.isActive ?? true,
          tenantId,
          userId,
        ],
      );

      const region = result.rows[0];
      this.logger.log(`Region created: ${region.id}`);

      return this.mapToResponseDto(region);
    } catch (error) {
      this.logger.error(`Error creating region: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto: BaseFilterDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<RegionResponseDto>> {
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
      const whereConditions = ['r.tenant_id = $1'];
      const queryParams = [tenantId];
      let paramIndex = 2;

      if (filterDto.isActive !== undefined) {
        whereConditions.push(`r.is_active = $${paramIndex}`);
        queryParams.push(filterDto.isActive.toString());
        paramIndex++;
      }

      if (search) {
        whereConditions.push(
          `(r.name ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`,
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
        FROM regions r
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
          r.*,
          COALESCE(zones_count.count, 0) as zones_count,
          COALESCE(sites_count.count, 0) as sites_count,
          COALESCE(vehicles_count.count, 0) as vehicles_count
        FROM regions r
        LEFT JOIN (
          SELECT region_id, COUNT(*) as count 
          FROM zones 
          WHERE is_active = true 
          GROUP BY region_id
        ) zones_count ON r.id = zones_count.region_id
        LEFT JOIN (
          SELECT region_id, COUNT(*) as count 
          FROM sites 
          WHERE is_active = true 
          GROUP BY region_id
        ) sites_count ON r.id = sites_count.region_id
        LEFT JOIN (
          SELECT assigned_region_id, COUNT(*) as count 
          FROM vehicles 
          WHERE is_active = true 
          GROUP BY assigned_region_id
        ) vehicles_count ON r.id = vehicles_count.assigned_region_id
        ${whereClause}
        ORDER BY r.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataResult = await this.databaseService.query(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const regions = dataResult.rows.map((row) => this.mapToResponseDto(row));

      return {
        data: regions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error(`Error fetching regions: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, tenantId: string): Promise<RegionResponseDto> {
    try {
      const result = await this.databaseService.query(
        `SELECT 
          r.*,
          COALESCE(zones_count.count, 0) as zones_count,
          COALESCE(sites_count.count, 0) as sites_count,
          COALESCE(vehicles_count.count, 0) as vehicles_count
        FROM regions r
        LEFT JOIN (
          SELECT region_id, COUNT(*) as count 
          FROM zones 
          WHERE is_active = true 
          GROUP BY region_id
        ) zones_count ON r.id = zones_count.region_id
        LEFT JOIN (
          SELECT region_id, COUNT(*) as count 
          FROM sites 
          WHERE is_active = true 
          GROUP BY region_id
        ) sites_count ON r.id = sites_count.region_id
        LEFT JOIN (
          SELECT assigned_region_id, COUNT(*) as count 
          FROM vehicles 
          WHERE is_active = true 
          GROUP BY assigned_region_id
        ) vehicles_count ON r.id = vehicles_count.assigned_region_id
        WHERE r.id = $1 AND r.tenant_id = $2`,
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Region not found');
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error fetching region ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateRegionDto: UpdateRegionDto,
    userId: string,
    tenantId: string,
  ): Promise<RegionResponseDto> {
    try {
      // Check if region exists
      const existingRegion = await this.findOne(id, tenantId);

      // Check if name is being updated and if it conflicts with existing region
      if (
        updateRegionDto.name &&
        updateRegionDto.name !== existingRegion.name
      ) {
        const nameConflict = await this.databaseService.query(
          'SELECT id FROM regions WHERE name = $1 AND tenant_id = $2 AND id != $3 AND is_active = true',
          [updateRegionDto.name, tenantId, id],
        );

        if (nameConflict.rows.length > 0) {
          throw new ConflictException('Region with this name already exists');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (updateRegionDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        queryParams.push(updateRegionDto.name);
        paramIndex++;
      }

      if (updateRegionDto.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        queryParams.push(updateRegionDto.description);
        paramIndex++;
      }

      if (updateRegionDto.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        queryParams.push(updateRegionDto.isActive);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return existingRegion;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await this.databaseService.query(
        `UPDATE regions 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
         RETURNING *`,
        [...queryParams, id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Region not found');
      }

      this.logger.log(`Region updated: ${id}`);
      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating region ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    try {
      // Check if region has any active zones
      const zonesResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM zones WHERE region_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(zonesResult.rows[0].count) > 0) {
        throw new ConflictException('Cannot delete region with active zones');
      }

      // Check if region has any active sites
      const sitesResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM sites WHERE region_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(sitesResult.rows[0].count) > 0) {
        throw new ConflictException('Cannot delete region with active sites');
      }

      // Check if region has any assigned vehicles
      const vehiclesResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM vehicles WHERE assigned_region_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(vehiclesResult.rows[0].count) > 0) {
        throw new ConflictException(
          'Cannot delete region with assigned vehicles',
        );
      }

      const result = await this.databaseService.query(
        'DELETE FROM regions WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Region not found');
      }

      this.logger.log(`Region deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting region ${id}: ${error.message}`);
      throw error;
    }
  }

  private mapToResponseDto(region: any): RegionResponseDto {
    return {
      id: region.id,
      name: region.name,
      description: region.description,
      isActive: region.is_active,
      tenantId: region.tenant_id,
      createdBy: region.created_by,
      createdAt: region.created_at,
      updatedAt: region.updated_at,
      zonesCount: parseInt(region.zones_count) || 0,
      sitesCount: parseInt(region.sites_count) || 0,
      vehiclesCount: parseInt(region.vehicles_count) || 0,
    };
  }
}
