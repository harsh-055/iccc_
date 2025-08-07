import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  CreateWorkforceDto,
  UpdateWorkforceDto,
  WorkforceResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';

@Injectable()
export class WorkforceService {
  private readonly logger = new Logger(WorkforceService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    createWorkforceDto: CreateWorkforceDto,
    userId: string,
    tenantId: string,
  ): Promise<WorkforceResponseDto> {
    try {
      // Check if workforce already exists for this employee
      const existingWorkforce = await this.databaseService.query(
        'SELECT id FROM workforce WHERE employee_id = $1 AND tenant_id = $2 AND is_active = true',
        [createWorkforceDto.employeeId, tenantId],
      );

      if (existingWorkforce.rows.length > 0) {
        throw new ConflictException(
          'Workforce already exists for this employee',
        );
      }

      // Validate employee exists and belongs to tenant
      const employee = await this.databaseService.query(
        'SELECT id, first_name, last_name, email FROM users WHERE id = $1 AND tenant_id = $2 AND is_active = true',
        [createWorkforceDto.employeeId, tenantId],
      );

      if (employee.rows.length === 0) {
        throw new NotFoundException('Employee not found');
      }

      // Validate workforce type exists
      const workforceType = await this.databaseService.query(
        'SELECT id FROM workforce_types WHERE id = $1 AND is_active = true',
        [createWorkforceDto.workforceTypeId],
      );

      if (workforceType.rows.length === 0) {
        throw new NotFoundException('Workforce type not found');
      }

      // Validate route if provided
      if (createWorkforceDto.assignedRouteId) {
        const route = await this.databaseService.query(
          'SELECT id FROM routes WHERE id = $1 AND is_active = true',
          [createWorkforceDto.assignedRouteId],
        );

        if (route.rows.length === 0) {
          throw new NotFoundException('Route not found');
        }
      }

      // Validate shift if provided
      if (createWorkforceDto.assignedShiftId) {
        const shift = await this.databaseService.query(
          'SELECT id FROM shifts WHERE id = $1 AND is_active = true',
          [createWorkforceDto.assignedShiftId],
        );

        if (shift.rows.length === 0) {
          throw new NotFoundException('Shift not found');
        }
      }

      // Validate vehicle if provided
      if (createWorkforceDto.assignedVehicleId) {
        const vehicle = await this.databaseService.query(
          'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createWorkforceDto.assignedVehicleId, tenantId],
        );

        if (vehicle.rows.length === 0) {
          throw new NotFoundException('Vehicle not found');
        }
      }

      // Validate region if provided
      if (createWorkforceDto.assignedRegionId) {
        const region = await this.databaseService.query(
          'SELECT id FROM regions WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createWorkforceDto.assignedRegionId, tenantId],
        );

        if (region.rows.length === 0) {
          throw new NotFoundException('Region not found');
        }
      }

      // Validate zone if provided
      if (createWorkforceDto.assignedZoneId) {
        const zone = await this.databaseService.query(
          'SELECT id FROM zones WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createWorkforceDto.assignedZoneId, tenantId],
        );

        if (zone.rows.length === 0) {
          throw new NotFoundException('Zone not found');
        }
      }

      // Validate ward if provided
      if (createWorkforceDto.assignedWardId) {
        const ward = await this.databaseService.query(
          'SELECT id FROM wards WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createWorkforceDto.assignedWardId, tenantId],
        );

        if (ward.rows.length === 0) {
          throw new NotFoundException('Ward not found');
        }
      }

      // Validate site if provided
      if (createWorkforceDto.assignedSiteId) {
        const site = await this.databaseService.query(
          'SELECT id FROM sites WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createWorkforceDto.assignedSiteId, tenantId],
        );

        if (site.rows.length === 0) {
          throw new NotFoundException('Site not found');
        }
      }

      // Validate equipment if provided
      if (
        createWorkforceDto.equipmentIds &&
        createWorkforceDto.equipmentIds.length > 0
      ) {
        for (const equipmentId of createWorkforceDto.equipmentIds) {
          const equipment = await this.databaseService.query(
            'SELECT id FROM inventory_items WHERE id = $1 AND tenant_id = $2 AND is_active = true',
            [equipmentId, tenantId],
          );

          if (equipment.rows.length === 0) {
            throw new NotFoundException(
              `Equipment with ID ${equipmentId} not found`,
            );
          }
        }
      }

      const result = await this.databaseService.query(
        `INSERT INTO workforce (
          employee_id, workforce_type_id, assigned_route_id, assigned_shift_id, assigned_vehicle_id,
          assigned_region_id, assigned_zone_id, assigned_ward_id, assigned_site_id, status,
          hire_date, salary, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
          address, latitude, longitude, is_active, image_url, notes, tenant_id, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING *`,
        [
          createWorkforceDto.employeeId,
          createWorkforceDto.workforceTypeId,
          createWorkforceDto.assignedRouteId,
          createWorkforceDto.assignedShiftId,
          createWorkforceDto.assignedVehicleId,
          createWorkforceDto.assignedRegionId,
          createWorkforceDto.assignedZoneId,
          createWorkforceDto.assignedWardId,
          createWorkforceDto.assignedSiteId,
          createWorkforceDto.status,
          createWorkforceDto.hireDate,
          createWorkforceDto.salary,
          createWorkforceDto.emergencyContactName,
          createWorkforceDto.emergencyContactPhone,
          createWorkforceDto.emergencyContactRelationship,
          createWorkforceDto.address,
          createWorkforceDto.latitude,
          createWorkforceDto.longitude,
          createWorkforceDto.isActive ?? true,
          createWorkforceDto.imageUrl,
          createWorkforceDto.notes,
          tenantId,
          userId,
        ],
      );

      const workforce = result.rows[0];
      this.logger.log(`Workforce created: ${workforce.id}`);

      // Assign equipment if provided
      if (
        createWorkforceDto.equipmentIds &&
        createWorkforceDto.equipmentIds.length > 0
      ) {
        for (const equipmentId of createWorkforceDto.equipmentIds) {
          await this.databaseService.query(
            `INSERT INTO workforce_equipment (workforce_id, inventory_item_id, assigned_date, tenant_id, created_by)
             VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)`,
            [workforce.id, equipmentId, tenantId, userId],
          );
        }
      }

      return this.mapToResponseDto(workforce);
    } catch (error) {
      this.logger.error(`Error creating workforce: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto: BaseFilterDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<WorkforceResponseDto>> {
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

      if (filterDto.status) {
        whereConditions.push(`w.status = $${paramIndex}`);
        queryParams.push(filterDto.status);
        paramIndex++;
      }

      if (filterDto.workforceTypeId) {
        whereConditions.push(`w.workforce_type_id = $${paramIndex}`);
        queryParams.push(filterDto.workforceTypeId);
        paramIndex++;
      }

      if (filterDto.assignedSiteId) {
        whereConditions.push(`w.assigned_site_id = $${paramIndex}`);
        queryParams.push(filterDto.assignedSiteId);
        paramIndex++;
      }

      if (filterDto.assignedRegionId) {
        whereConditions.push(`w.assigned_region_id = $${paramIndex}`);
        queryParams.push(filterDto.assignedRegionId);
        paramIndex++;
      }

      if (filterDto.assignedZoneId) {
        whereConditions.push(`w.assigned_zone_id = $${paramIndex}`);
        queryParams.push(filterDto.assignedZoneId);
        paramIndex++;
      }

      if (filterDto.assignedWardId) {
        whereConditions.push(`w.assigned_ward_id = $${paramIndex}`);
        queryParams.push(filterDto.assignedWardId);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(
          `(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`,
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
        FROM workforce w
        LEFT JOIN users u ON w.employee_id = u.id
        ${whereClause}
      `;
      const countResult = await this.databaseService.query(
        countQuery,
        queryParams,
      );
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with joins
      const dataQuery = `
        SELECT 
          w.*,
          u.first_name || ' ' || u.last_name as employee_name,
          u.email as employee_email,
          wt.name as workforce_type_name,
          r.name as assigned_route_name,
          s.name as assigned_shift_name,
          v.name as assigned_vehicle_name,
          reg.name as assigned_region_name,
          z.name as assigned_zone_name,
          ward.name as assigned_ward_name,
          site.name as assigned_site_name,
          COALESCE(equipment_count.count, 0) as equipment_count
        FROM workforce w
        LEFT JOIN users u ON w.employee_id = u.id
        LEFT JOIN workforce_types wt ON w.workforce_type_id = wt.id
        LEFT JOIN routes r ON w.assigned_route_id = r.id
        LEFT JOIN shifts s ON w.assigned_shift_id = s.id
        LEFT JOIN vehicles v ON w.assigned_vehicle_id = v.id
        LEFT JOIN regions reg ON w.assigned_region_id = reg.id
        LEFT JOIN zones z ON w.assigned_zone_id = z.id
        LEFT JOIN wards ward ON w.assigned_ward_id = ward.id
        LEFT JOIN sites site ON w.assigned_site_id = site.id
        LEFT JOIN (
          SELECT workforce_id, COUNT(*) as count 
          FROM workforce_equipment 
          WHERE is_active = true 
          GROUP BY workforce_id
        ) equipment_count ON w.id = equipment_count.workforce_id
        ${whereClause}
        ORDER BY w.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataResult = await this.databaseService.query(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const workforce = dataResult.rows.map((row) =>
        this.mapToResponseDto(row),
      );

      return {
        data: workforce,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error(`Error fetching workforce: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, tenantId: string): Promise<WorkforceResponseDto> {
    try {
      const result = await this.databaseService.query(
        `SELECT 
          w.*,
          u.first_name || ' ' || u.last_name as employee_name,
          u.email as employee_email,
          wt.name as workforce_type_name,
          r.name as assigned_route_name,
          s.name as assigned_shift_name,
          v.name as assigned_vehicle_name,
          reg.name as assigned_region_name,
          z.name as assigned_zone_name,
          ward.name as assigned_ward_name,
          site.name as assigned_site_name,
          COALESCE(equipment_count.count, 0) as equipment_count
        FROM workforce w
        LEFT JOIN users u ON w.employee_id = u.id
        LEFT JOIN workforce_types wt ON w.workforce_type_id = wt.id
        LEFT JOIN routes r ON w.assigned_route_id = r.id
        LEFT JOIN shifts s ON w.assigned_shift_id = s.id
        LEFT JOIN vehicles v ON w.assigned_vehicle_id = v.id
        LEFT JOIN regions reg ON w.assigned_region_id = reg.id
        LEFT JOIN zones z ON w.assigned_zone_id = z.id
        LEFT JOIN wards ward ON w.assigned_ward_id = ward.id
        LEFT JOIN sites site ON w.assigned_site_id = site.id
        LEFT JOIN (
          SELECT workforce_id, COUNT(*) as count 
          FROM workforce_equipment 
          WHERE is_active = true 
          GROUP BY workforce_id
        ) equipment_count ON w.id = equipment_count.workforce_id
        WHERE w.id = $1 AND w.tenant_id = $2`,
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Workforce not found');
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error fetching workforce ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateWorkforceDto: UpdateWorkforceDto,
    userId: string,
    tenantId: string,
  ): Promise<WorkforceResponseDto> {
    try {
      // Check if workforce exists
      const existingWorkforce = await this.findOne(id, tenantId);

      // Validate workforce type if being updated
      if (updateWorkforceDto.workforceTypeId) {
        const workforceType = await this.databaseService.query(
          'SELECT id FROM workforce_types WHERE id = $1 AND is_active = true',
          [updateWorkforceDto.workforceTypeId],
        );

        if (workforceType.rows.length === 0) {
          throw new NotFoundException('Workforce type not found');
        }
      }

      // Validate route if being updated
      if (updateWorkforceDto.assignedRouteId) {
        const route = await this.databaseService.query(
          'SELECT id FROM routes WHERE id = $1 AND is_active = true',
          [updateWorkforceDto.assignedRouteId],
        );

        if (route.rows.length === 0) {
          throw new NotFoundException('Route not found');
        }
      }

      // Validate shift if being updated
      if (updateWorkforceDto.assignedShiftId) {
        const shift = await this.databaseService.query(
          'SELECT id FROM shifts WHERE id = $1 AND is_active = true',
          [updateWorkforceDto.assignedShiftId],
        );

        if (shift.rows.length === 0) {
          throw new NotFoundException('Shift not found');
        }
      }

      // Validate vehicle if being updated
      if (updateWorkforceDto.assignedVehicleId) {
        const vehicle = await this.databaseService.query(
          'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateWorkforceDto.assignedVehicleId, tenantId],
        );

        if (vehicle.rows.length === 0) {
          throw new NotFoundException('Vehicle not found');
        }
      }

      // Validate region if being updated
      if (updateWorkforceDto.assignedRegionId) {
        const region = await this.databaseService.query(
          'SELECT id FROM regions WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateWorkforceDto.assignedRegionId, tenantId],
        );

        if (region.rows.length === 0) {
          throw new NotFoundException('Region not found');
        }
      }

      // Validate zone if being updated
      if (updateWorkforceDto.assignedZoneId) {
        const zone = await this.databaseService.query(
          'SELECT id FROM zones WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateWorkforceDto.assignedZoneId, tenantId],
        );

        if (zone.rows.length === 0) {
          throw new NotFoundException('Zone not found');
        }
      }

      // Validate ward if being updated
      if (updateWorkforceDto.assignedWardId) {
        const ward = await this.databaseService.query(
          'SELECT id FROM wards WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateWorkforceDto.assignedWardId, tenantId],
        );

        if (ward.rows.length === 0) {
          throw new NotFoundException('Ward not found');
        }
      }

      // Validate site if being updated
      if (updateWorkforceDto.assignedSiteId) {
        const site = await this.databaseService.query(
          'SELECT id FROM sites WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateWorkforceDto.assignedSiteId, tenantId],
        );

        if (site.rows.length === 0) {
          throw new NotFoundException('Site not found');
        }
      }

      // Validate equipment if provided
      if (
        updateWorkforceDto.equipmentIds &&
        updateWorkforceDto.equipmentIds.length > 0
      ) {
        for (const equipmentId of updateWorkforceDto.equipmentIds) {
          const equipment = await this.databaseService.query(
            'SELECT id FROM inventory_items WHERE id = $1 AND tenant_id = $2 AND is_active = true',
            [equipmentId, tenantId],
          );

          if (equipment.rows.length === 0) {
            throw new NotFoundException(
              `Equipment with ID ${equipmentId} not found`,
            );
          }
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (updateWorkforceDto.workforceTypeId !== undefined) {
        updateFields.push(`workforce_type_id = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.workforceTypeId);
        paramIndex++;
      }

      if (updateWorkforceDto.assignedRouteId !== undefined) {
        updateFields.push(`assigned_route_id = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.assignedRouteId);
        paramIndex++;
      }

      if (updateWorkforceDto.assignedShiftId !== undefined) {
        updateFields.push(`assigned_shift_id = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.assignedShiftId);
        paramIndex++;
      }

      if (updateWorkforceDto.assignedVehicleId !== undefined) {
        updateFields.push(`assigned_vehicle_id = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.assignedVehicleId);
        paramIndex++;
      }

      if (updateWorkforceDto.assignedRegionId !== undefined) {
        updateFields.push(`assigned_region_id = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.assignedRegionId);
        paramIndex++;
      }

      if (updateWorkforceDto.assignedZoneId !== undefined) {
        updateFields.push(`assigned_zone_id = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.assignedZoneId);
        paramIndex++;
      }

      if (updateWorkforceDto.assignedWardId !== undefined) {
        updateFields.push(`assigned_ward_id = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.assignedWardId);
        paramIndex++;
      }

      if (updateWorkforceDto.assignedSiteId !== undefined) {
        updateFields.push(`assigned_site_id = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.assignedSiteId);
        paramIndex++;
      }

      if (updateWorkforceDto.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.status);
        paramIndex++;
      }

      if (updateWorkforceDto.hireDate !== undefined) {
        updateFields.push(`hire_date = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.hireDate);
        paramIndex++;
      }

      if (updateWorkforceDto.salary !== undefined) {
        updateFields.push(`salary = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.salary);
        paramIndex++;
      }

      if (updateWorkforceDto.emergencyContactName !== undefined) {
        updateFields.push(`emergency_contact_name = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.emergencyContactName);
        paramIndex++;
      }

      if (updateWorkforceDto.emergencyContactPhone !== undefined) {
        updateFields.push(`emergency_contact_phone = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.emergencyContactPhone);
        paramIndex++;
      }

      if (updateWorkforceDto.emergencyContactRelationship !== undefined) {
        updateFields.push(`emergency_contact_relationship = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.emergencyContactRelationship);
        paramIndex++;
      }

      if (updateWorkforceDto.address !== undefined) {
        updateFields.push(`address = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.address);
        paramIndex++;
      }

      if (updateWorkforceDto.latitude !== undefined) {
        updateFields.push(`latitude = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.latitude);
        paramIndex++;
      }

      if (updateWorkforceDto.longitude !== undefined) {
        updateFields.push(`longitude = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.longitude);
        paramIndex++;
      }

      if (updateWorkforceDto.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.isActive);
        paramIndex++;
      }

      if (updateWorkforceDto.imageUrl !== undefined) {
        updateFields.push(`image_url = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.imageUrl);
        paramIndex++;
      }

      if (updateWorkforceDto.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex}`);
        queryParams.push(updateWorkforceDto.notes);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return existingWorkforce;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await this.databaseService.query(
        `UPDATE workforce 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
         RETURNING *`,
        [...queryParams, id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Workforce not found');
      }

      // Update equipment assignments if provided
      if (updateWorkforceDto.equipmentIds !== undefined) {
        // Remove existing equipment assignments
        await this.databaseService.query(
          'UPDATE workforce_equipment SET is_active = false WHERE workforce_id = $1',
          [id],
        );

        // Add new equipment assignments
        if (updateWorkforceDto.equipmentIds.length > 0) {
          for (const equipmentId of updateWorkforceDto.equipmentIds) {
            await this.databaseService.query(
              `INSERT INTO workforce_equipment (workforce_id, inventory_item_id, assigned_date, tenant_id, created_by)
               VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)`,
              [id, equipmentId, tenantId, userId],
            );
          }
        }
      }

      this.logger.log(`Workforce updated: ${id}`);
      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating workforce ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    try {
      // Check if workforce has any active equipment assignments
      const equipmentResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM workforce_equipment WHERE workforce_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(equipmentResult.rows[0].count) > 0) {
        throw new ConflictException(
          'Cannot delete workforce with active equipment assignments',
        );
      }

      const result = await this.databaseService.query(
        'DELETE FROM workforce WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Workforce not found');
      }

      this.logger.log(`Workforce deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting workforce ${id}: ${error.message}`);
      throw error;
    }
  }

  private mapToResponseDto(workforce: any): WorkforceResponseDto {
    const today = new Date();
    const hireDate = new Date(workforce.hire_date);
    const daysSinceHire = Math.ceil(
      (today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: workforce.id,
      employeeId: workforce.employee_id,
      employeeName: workforce.employee_name,
      employeeEmail: workforce.employee_email,
      workforceTypeId: workforce.workforce_type_id,
      workforceTypeName: workforce.workforce_type_name,
      assignedRouteId: workforce.assigned_route_id,
      assignedRouteName: workforce.assigned_route_name,
      assignedShiftId: workforce.assigned_shift_id,
      assignedShiftName: workforce.assigned_shift_name,
      assignedVehicleId: workforce.assigned_vehicle_id,
      assignedVehicleName: workforce.assigned_vehicle_name,
      assignedRegionId: workforce.assigned_region_id,
      assignedRegionName: workforce.assigned_region_name,
      assignedZoneId: workforce.assigned_zone_id,
      assignedZoneName: workforce.assigned_zone_name,
      assignedWardId: workforce.assigned_ward_id,
      assignedWardName: workforce.assigned_ward_name,
      assignedSiteId: workforce.assigned_site_id,
      assignedSiteName: workforce.assigned_site_name,
      status: workforce.status,
      hireDate: workforce.hire_date,
      salary: workforce.salary,
      emergencyContactName: workforce.emergency_contact_name,
      emergencyContactPhone: workforce.emergency_contact_phone,
      emergencyContactRelationship: workforce.emergency_contact_relationship,
      address: workforce.address,
      latitude: workforce.latitude,
      longitude: workforce.longitude,
      isActive: workforce.is_active,
      imageUrl: workforce.image_url,
      notes: workforce.notes,
      tenantId: workforce.tenant_id,
      createdBy: workforce.created_by,
      createdAt: workforce.created_at,
      updatedAt: workforce.updated_at,
      equipmentCount: parseInt(workforce.equipment_count) || 0,
      daysSinceHire,
    };
  }
}
