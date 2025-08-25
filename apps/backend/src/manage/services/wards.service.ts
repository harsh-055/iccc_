import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  CreateWardDto,
  UpdateWardDto,
  WardResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  WardFilterDto,
} from '../dto';

@Injectable()
export class WardsService {
  private readonly logger = new Logger(WardsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    createWardDto: CreateWardDto,
    userId: string,
    tenantId: string,
  ): Promise<WardResponseDto> {
    try {
      // Check if ward with same name already exists in the zone
      const existingWard = await this.databaseService.query(
        'SELECT id FROM wards WHERE name = $1 AND zone_id = $2 AND tenant_id = $3 AND is_active = true',
        [createWardDto.name, createWardDto.zoneId, tenantId],
      );

      if (existingWard.rows.length > 0) {
        throw new ConflictException(
          'Ward with this name already exists in this zone',
        );
      }

      // Validate zone exists and belongs to tenant
      const zone = await this.databaseService.query(
        'SELECT z.id, z.region_id, r.name as region_name FROM zones z LEFT JOIN regions r ON z.region_id = r.id WHERE z.id = $1 AND z.tenant_id = $2 AND z.is_active = true',
        [createWardDto.zoneId, tenantId],
      );

      if (zone.rows.length === 0) {
        throw new NotFoundException('Zone not found');
      }

      const result = await this.databaseService.query(
        `INSERT INTO wards (name, description, zone_id, ward_no, is_active, tenant_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          createWardDto.name,
          createWardDto.description,
          createWardDto.zoneId,
          createWardDto.wardNo,
          createWardDto.isActive ?? true,
          tenantId,
          userId,
        ],
      );

      const ward = result.rows[0];
      this.logger.log(`Ward created: ${ward.id}`);

      return this.mapToResponseDto(ward, zone.rows[0]);
    } catch (error) {
      this.logger.error(`Error creating ward: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto: WardFilterDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<WardResponseDto>> {
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
      const whereConditions = ['w.tenant_id = $1'];
      const queryParams = [tenantId];
      let paramIndex = 2;

      if (filterDto.isActive !== undefined) {
        whereConditions.push(`w.is_active = $${paramIndex}`);
        queryParams.push(filterDto.isActive.toString());
        paramIndex++;
      }

      if (filterDto.zoneId) {
        whereConditions.push(`w.zone_id = $${paramIndex}`);
        queryParams.push(filterDto.zoneId);
        paramIndex++;
      }

      if (filterDto.regionId) {
        whereConditions.push(`z.region_id = $${paramIndex}`);
        queryParams.push(filterDto.regionId);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(
          `(w.name ILIKE $${paramIndex} OR w.description ILIKE $${paramIndex})`,
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
        FROM wards w
        LEFT JOIN zones z ON w.zone_id = z.id
        ${whereClause}
      `;
      const countResult = await this.databaseService.query(
        countQuery,
        queryParams,
      );
      const total = parseInt(countResult.rows[0].total);

      const limitParamIndex = paramIndex;
      const offsetParamIndex = paramIndex + 1;
      
      // Get paginated data with counts
      const dataQuery = `
        SELECT 
          w.*,
          z.name as zone_name,
          z.region_id,
          r.name as region_name,
          COALESCE(sites_count.count, 0) as sites_count,
          COALESCE(vehicles_count.count, 0) as vehicles_count,
          COALESCE(workforce_count.count, 0) as workforce_count
        FROM wards w
        LEFT JOIN zones z ON w.zone_id = z.id
        LEFT JOIN regions r ON z.region_id = r.id
        LEFT JOIN (
          SELECT ward_id, COUNT(*) as count 
          FROM sites 
          WHERE is_active = true 
          GROUP BY ward_id
        ) sites_count ON w.id = sites_count.ward_id
        LEFT JOIN (
          SELECT assigned_ward_id, COUNT(*) as count 
          FROM vehicles 
          WHERE is_active = true 
          GROUP BY assigned_ward_id
        ) vehicles_count ON w.id = vehicles_count.assigned_ward_id
        LEFT JOIN (
          SELECT ward_id, COUNT(*) as count 
          FROM workforce 
          WHERE is_active = true 
          GROUP BY ward_id
        ) workforce_count ON w.id = workforce_count.ward_id
        ${whereClause}
        ORDER BY w.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
      `;

      const dataResult = await this.databaseService.query(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const wards = dataResult.rows.map((row) => this.mapToResponseDto(row));

      return {
        data: wards,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error(`Error fetching wards: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, tenantId: string): Promise<WardResponseDto> {
    try {
      const result = await this.databaseService.query(
        `SELECT 
          w.*,
          z.name as zone_name,
          z.region_id,
          r.name as region_name,
          COALESCE(sites_count.count, 0) as sites_count,
          COALESCE(vehicles_count.count, 0) as vehicles_count,
          COALESCE(workforce_count.count, 0) as workforce_count
        FROM wards w
        LEFT JOIN zones z ON w.zone_id = z.id
        LEFT JOIN regions r ON z.region_id = r.id
        LEFT JOIN (
          SELECT ward_id, COUNT(*) as count 
          FROM sites 
          WHERE is_active = true 
          GROUP BY ward_id
        ) sites_count ON w.id = sites_count.ward_id
        LEFT JOIN (
          SELECT assigned_ward_id, COUNT(*) as count 
          FROM vehicles 
          WHERE is_active = true 
          GROUP BY assigned_ward_id
        ) vehicles_count ON w.id = vehicles_count.assigned_ward_id
        LEFT JOIN (
          SELECT ward_id, COUNT(*) as count 
          FROM workforce 
          WHERE is_active = true 
          GROUP BY ward_id
        ) workforce_count ON w.id = workforce_count.ward_id
        WHERE w.id = $1 AND w.tenant_id = $2`,
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Ward not found');
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error fetching ward ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateWardDto: UpdateWardDto,
    userId: string,
    tenantId: string,
  ): Promise<WardResponseDto> {
    try {
      // Check if ward exists
      const existingWard = await this.findOne(id, tenantId);

      // Check if name is being updated and if it conflicts with existing ward in the same zone
      if (updateWardDto.name && updateWardDto.name !== existingWard.name) {
        const nameConflict = await this.databaseService.query(
          'SELECT id FROM wards WHERE name = $1 AND zone_id = $2 AND tenant_id = $3 AND id != $4 AND is_active = true',
          [updateWardDto.name, existingWard.zoneId, tenantId, id],
        );

        if (nameConflict.rows.length > 0) {
          throw new ConflictException(
            'Ward with this name already exists in this zone',
          );
        }
      }

      // Validate zone if being updated
      if (updateWardDto.zoneId) {
        const zone = await this.databaseService.query(
          'SELECT id FROM zones WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateWardDto.zoneId, tenantId],
        );

        if (zone.rows.length === 0) {
          throw new NotFoundException('Zone not found');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (updateWardDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        queryParams.push(updateWardDto.name);
        paramIndex++;
      }

      if (updateWardDto.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        queryParams.push(updateWardDto.description);
        paramIndex++;
      }

      if (updateWardDto.zoneId !== undefined) {
        updateFields.push(`zone_id = $${paramIndex}`);
        queryParams.push(updateWardDto.zoneId);
        paramIndex++;
      }

      if (updateWardDto.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        queryParams.push(updateWardDto.isActive);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return existingWard;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await this.databaseService.query(
        `UPDATE wards 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
         RETURNING *`,
        [...queryParams, id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Ward not found');
      }

      this.logger.log(`Ward updated: ${id}`);
      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating ward ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    try {
      // Check if ward has any active sites
      const sitesResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM sites WHERE ward_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(sitesResult.rows[0].count) > 0) {
        throw new ConflictException('Cannot delete ward with active sites');
      }

      // Check if ward has any assigned vehicles
      const vehiclesResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM vehicles WHERE assigned_ward_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(vehiclesResult.rows[0].count) > 0) {
        throw new ConflictException(
          'Cannot delete ward with assigned vehicles',
        );
      }

      // Check if ward has any assigned workforce
      const workforceResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM workforce WHERE ward_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(workforceResult.rows[0].count) > 0) {
        throw new ConflictException(
          'Cannot delete ward with assigned workforce',
        );
      }

      const result = await this.databaseService.query(
        'DELETE FROM wards WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Ward not found');
      }

      this.logger.log(`Ward deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting ward ${id}: ${error.message}`);
      throw error;
    }
  }

  private mapToResponseDto(ward: any, zoneData?: any): WardResponseDto {
    return {
      id: ward.id,
      name: ward.name,
      wardNo: ward.ward_no,
      description: ward.description,
      zoneId: ward.zone_id,
      zoneName: ward.zone_name,
      regionId: ward.region_id,
      regionName: ward.region_name,
      isActive: ward.is_active,
      tenantId: ward.tenant_id,
      createdBy: ward.created_by,
      createdAt: ward.created_at,
      updatedAt: ward.updated_at,
      sitesCount: parseInt(ward.sites_count) || 0,
      vehiclesCount: parseInt(ward.vehicles_count) || 0,
      workforceCount: parseInt(ward.workforce_count) || 0,
    };
  }
}
