import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    createVehicleDto: CreateVehicleDto,
    userId: string,
    tenantId: string,
  ): Promise<VehicleResponseDto> {
    try {
      // Check if vehicle with same license plate already exists
      const existingVehicle = await this.databaseService.query(
        'SELECT id FROM vehicles WHERE license_plate_number = $1 AND tenant_id = $2 AND is_active = true',
        [createVehicleDto.licensePlateNumber, tenantId],
      );

      if (existingVehicle.rows.length > 0) {
        throw new ConflictException(
          'Vehicle with this license plate number already exists',
        );
      }

      // Check if vehicle with same registration number already exists
      const existingRegistration = await this.databaseService.query(
        'SELECT id FROM vehicles WHERE registration_number = $1 AND tenant_id = $2 AND is_active = true',
        [createVehicleDto.registrationNumber, tenantId],
      );

      if (existingRegistration.rows.length > 0) {
        throw new ConflictException(
          'Vehicle with this registration number already exists',
        );
      }

      // Validate vehicle type exists
      const vehicleType = await this.databaseService.query(
        'SELECT id FROM vehicle_types WHERE id = $1 AND is_active = true',
        [createVehicleDto.vehicleTypeId],
      );

      if (vehicleType.rows.length === 0) {
        throw new NotFoundException('Vehicle type not found');
      }

      // Validate fuel type exists
      const fuelType = await this.databaseService.query(
        'SELECT id FROM fuel_types WHERE id = $1 AND is_active = true',
        [createVehicleDto.fuelTypeId],
      );

      if (fuelType.rows.length === 0) {
        throw new NotFoundException('Fuel type not found');
      }

      // Validate driver if provided
      if (createVehicleDto.assignedDriverId) {
        const driver = await this.databaseService.query(
          'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createVehicleDto.assignedDriverId, tenantId],
        );

        if (driver.rows.length === 0) {
          throw new NotFoundException('Driver not found');
        }
      }

      // Validate region if provided
      if (createVehicleDto.assignedRegionId) {
        const region = await this.databaseService.query(
          'SELECT id FROM regions WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createVehicleDto.assignedRegionId, tenantId],
        );

        if (region.rows.length === 0) {
          throw new NotFoundException('Region not found');
        }
      }

      // Validate zone if provided
      if (createVehicleDto.assignedZoneId) {
        const zone = await this.databaseService.query(
          'SELECT id FROM zones WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createVehicleDto.assignedZoneId, tenantId],
        );

        if (zone.rows.length === 0) {
          throw new NotFoundException('Zone not found');
        }
      }

      // Validate ward if provided
      if (createVehicleDto.assignedWardId) {
        const ward = await this.databaseService.query(
          'SELECT id FROM wards WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createVehicleDto.assignedWardId, tenantId],
        );

        if (ward.rows.length === 0) {
          throw new NotFoundException('Ward not found');
        }
      }

      const result = await this.databaseService.query(
        `INSERT INTO vehicles (
          name, vehicle_type_id, license_plate_number, registration_number, fuel_type_id,
          insurance_expiry_date, last_maintenance_date, enable_gps_tracking, assigned_driver_id,
          assigned_region_id, assigned_zone_id, assigned_ward_id, status, image_url,
          address, tenant_id, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          createVehicleDto.name,
          createVehicleDto.vehicleTypeId,
          createVehicleDto.licensePlateNumber,
          createVehicleDto.registrationNumber,
          createVehicleDto.fuelTypeId,
          createVehicleDto.insuranceExpiryDate,
          createVehicleDto.lastMaintenanceDate,
          createVehicleDto.enableGpsTracking ?? true,
          createVehicleDto.assignedDriverId,
          createVehicleDto.assignedRegionId,
          createVehicleDto.assignedZoneId,
          createVehicleDto.assignedWardId,
          createVehicleDto.status,
          createVehicleDto.imageUrl,
          createVehicleDto.address,
          tenantId,
          userId,
        ],
      );

      const vehicle = result.rows[0];
      this.logger.log(`Vehicle created: ${vehicle.id}`);

      return this.mapToResponseDto(vehicle);
    } catch (error) {
      this.logger.error(`Error creating vehicle: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto: BaseFilterDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<VehicleResponseDto>> {
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
      const whereConditions = ['v.tenant_id = $1'];
      const queryParams = [tenantId];
      let paramIndex = 2;

      if (filterDto.isActive !== undefined) {
        whereConditions.push(`v.is_active = $${paramIndex}`);
        queryParams.push(filterDto.isActive.toString());
        paramIndex++;
      }

      if (filterDto.status) {
        whereConditions.push(`v.status = $${paramIndex}`);
        queryParams.push(filterDto.status);
        paramIndex++;
      }

      if (filterDto.regionId) {
        whereConditions.push(`v.assigned_region_id = $${paramIndex}`);
        queryParams.push(filterDto.regionId);
        paramIndex++;
      }

      if (filterDto.zoneId) {
        whereConditions.push(`v.assigned_zone_id = $${paramIndex}`);
        queryParams.push(filterDto.zoneId);
        paramIndex++;
      }

      if (filterDto.wardId) {
        whereConditions.push(`v.assigned_ward_id = $${paramIndex}`);
        queryParams.push(filterDto.wardId);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(
          `(v.name ILIKE $${paramIndex} OR v.license_plate_number ILIKE $${paramIndex} OR v.registration_number ILIKE $${paramIndex})`,
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
        FROM vehicles v
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
          v.*,
          vt.name as vehicle_type_name,
          ft.name as fuel_type_name,
          u.first_name || ' ' || u.last_name as assigned_driver_name,
          r.name as assigned_region_name,
          z.name as assigned_zone_name,
          w.name as assigned_ward_name
        FROM vehicles v
        LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
        LEFT JOIN fuel_types ft ON v.fuel_type_id = ft.id
        LEFT JOIN users u ON v.assigned_driver_id = u.id
        LEFT JOIN regions r ON v.assigned_region_id = r.id
        LEFT JOIN zones z ON v.assigned_zone_id = z.id
        LEFT JOIN wards w ON v.assigned_ward_id = w.id
        ${whereClause}
        ORDER BY v.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataResult = await this.databaseService.query(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const vehicles = dataResult.rows.map((row) => this.mapToResponseDto(row));

      return {
        data: vehicles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error(`Error fetching vehicles: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, tenantId: string): Promise<VehicleResponseDto> {
    try {
      const result = await this.databaseService.query(
        `SELECT 
          v.*,
          vt.name as vehicle_type_name,
          ft.name as fuel_type_name,
          u.first_name || ' ' || u.last_name as assigned_driver_name,
          r.name as assigned_region_name,
          z.name as assigned_zone_name,
          w.name as assigned_ward_name
        FROM vehicles v
        LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
        LEFT JOIN fuel_types ft ON v.fuel_type_id = ft.id
        LEFT JOIN users u ON v.assigned_driver_id = u.id
        LEFT JOIN regions r ON v.assigned_region_id = r.id
        LEFT JOIN zones z ON v.assigned_zone_id = z.id
        LEFT JOIN wards w ON v.assigned_ward_id = w.id
        WHERE v.id = $1 AND v.tenant_id = $2`,
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Vehicle not found');
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error fetching vehicle ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
    userId: string,
    tenantId: string,
  ): Promise<VehicleResponseDto> {
    try {
      // Check if vehicle exists
      const existingVehicle = await this.findOne(id, tenantId);

      // Check if license plate is being updated and if it conflicts
      if (
        updateVehicleDto.licensePlateNumber &&
        updateVehicleDto.licensePlateNumber !==
          existingVehicle.licensePlateNumber
      ) {
        const licenseConflict = await this.databaseService.query(
          'SELECT id FROM vehicles WHERE license_plate_number = $1 AND tenant_id = $2 AND id != $3 AND is_active = true',
          [updateVehicleDto.licensePlateNumber, tenantId, id],
        );

        if (licenseConflict.rows.length > 0) {
          throw new ConflictException(
            'Vehicle with this license plate number already exists',
          );
        }
      }

      // Check if registration number is being updated and if it conflicts
      if (
        updateVehicleDto.registrationNumber &&
        updateVehicleDto.registrationNumber !==
          existingVehicle.registrationNumber
      ) {
        const registrationConflict = await this.databaseService.query(
          'SELECT id FROM vehicles WHERE registration_number = $1 AND tenant_id = $2 AND id != $3 AND is_active = true',
          [updateVehicleDto.registrationNumber, tenantId, id],
        );

        if (registrationConflict.rows.length > 0) {
          throw new ConflictException(
            'Vehicle with this registration number already exists',
          );
        }
      }

      // Validate vehicle type if being updated
      if (updateVehicleDto.vehicleTypeId) {
        const vehicleType = await this.databaseService.query(
          'SELECT id FROM vehicle_types WHERE id = $1 AND is_active = true',
          [updateVehicleDto.vehicleTypeId],
        );

        if (vehicleType.rows.length === 0) {
          throw new NotFoundException('Vehicle type not found');
        }
      }

      // Validate fuel type if being updated
      if (updateVehicleDto.fuelTypeId) {
        const fuelType = await this.databaseService.query(
          'SELECT id FROM fuel_types WHERE id = $1 AND is_active = true',
          [updateVehicleDto.fuelTypeId],
        );

        if (fuelType.rows.length === 0) {
          throw new NotFoundException('Fuel type not found');
        }
      }

      // Validate driver if being updated
      if (updateVehicleDto.assignedDriverId) {
        const driver = await this.databaseService.query(
          'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateVehicleDto.assignedDriverId, tenantId],
        );

        if (driver.rows.length === 0) {
          throw new NotFoundException('Driver not found');
        }
      }

      // Validate region if being updated
      if (updateVehicleDto.assignedRegionId) {
        const region = await this.databaseService.query(
          'SELECT id FROM regions WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateVehicleDto.assignedRegionId, tenantId],
        );

        if (region.rows.length === 0) {
          throw new NotFoundException('Region not found');
        }
      }

      // Validate zone if being updated
      if (updateVehicleDto.assignedZoneId) {
        const zone = await this.databaseService.query(
          'SELECT id FROM zones WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateVehicleDto.assignedZoneId, tenantId],
        );

        if (zone.rows.length === 0) {
          throw new NotFoundException('Zone not found');
        }
      }

      // Validate ward if being updated
      if (updateVehicleDto.assignedWardId) {
        const ward = await this.databaseService.query(
          'SELECT id FROM wards WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateVehicleDto.assignedWardId, tenantId],
        );

        if (ward.rows.length === 0) {
          throw new NotFoundException('Ward not found');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (updateVehicleDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        queryParams.push(updateVehicleDto.name);
        paramIndex++;
      }

      if (updateVehicleDto.vehicleTypeId !== undefined) {
        updateFields.push(`vehicle_type_id = $${paramIndex}`);
        queryParams.push(updateVehicleDto.vehicleTypeId);
        paramIndex++;
      }

      if (updateVehicleDto.licensePlateNumber !== undefined) {
        updateFields.push(`license_plate_number = $${paramIndex}`);
        queryParams.push(updateVehicleDto.licensePlateNumber);
        paramIndex++;
      }

      if (updateVehicleDto.registrationNumber !== undefined) {
        updateFields.push(`registration_number = $${paramIndex}`);
        queryParams.push(updateVehicleDto.registrationNumber);
        paramIndex++;
      }

      if (updateVehicleDto.fuelTypeId !== undefined) {
        updateFields.push(`fuel_type_id = $${paramIndex}`);
        queryParams.push(updateVehicleDto.fuelTypeId);
        paramIndex++;
      }

      if (updateVehicleDto.insuranceExpiryDate !== undefined) {
        updateFields.push(`insurance_expiry_date = $${paramIndex}`);
        queryParams.push(updateVehicleDto.insuranceExpiryDate);
        paramIndex++;
      }

      if (updateVehicleDto.lastMaintenanceDate !== undefined) {
        updateFields.push(`last_maintenance_date = $${paramIndex}`);
        queryParams.push(updateVehicleDto.lastMaintenanceDate);
        paramIndex++;
      }

      if (updateVehicleDto.enableGpsTracking !== undefined) {
        updateFields.push(`enable_gps_tracking = $${paramIndex}`);
        queryParams.push(updateVehicleDto.enableGpsTracking);
        paramIndex++;
      }

      if (updateVehicleDto.assignedDriverId !== undefined) {
        updateFields.push(`assigned_driver_id = $${paramIndex}`);
        queryParams.push(updateVehicleDto.assignedDriverId);
        paramIndex++;
      }

      if (updateVehicleDto.assignedRegionId !== undefined) {
        updateFields.push(`assigned_region_id = $${paramIndex}`);
        queryParams.push(updateVehicleDto.assignedRegionId);
        paramIndex++;
      }

      if (updateVehicleDto.assignedZoneId !== undefined) {
        updateFields.push(`assigned_zone_id = $${paramIndex}`);
        queryParams.push(updateVehicleDto.assignedZoneId);
        paramIndex++;
      }

      if (updateVehicleDto.assignedWardId !== undefined) {
        updateFields.push(`assigned_ward_id = $${paramIndex}`);
        queryParams.push(updateVehicleDto.assignedWardId);
        paramIndex++;
      }

      if (updateVehicleDto.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        queryParams.push(updateVehicleDto.status);
        paramIndex++;
      }

      if (updateVehicleDto.imageUrl !== undefined) {
        updateFields.push(`image_url = $${paramIndex}`);
        queryParams.push(updateVehicleDto.imageUrl);
        paramIndex++;
      }

      if (updateVehicleDto.address !== undefined) {
        updateFields.push(`address = $${paramIndex}`);
        queryParams.push(updateVehicleDto.address);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return existingVehicle;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await this.databaseService.query(
        `UPDATE vehicles 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
         RETURNING *`,
        [...queryParams, id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Vehicle not found');
      }

      this.logger.log(`Vehicle updated: ${id}`);
      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating vehicle ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    try {
      // Check if vehicle has any assigned workforce
      const workforceResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM workforce WHERE vehicle_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(workforceResult.rows[0].count) > 0) {
        throw new ConflictException(
          'Cannot delete vehicle with assigned workforce',
        );
      }

      const result = await this.databaseService.query(
        'DELETE FROM vehicles WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Vehicle not found');
      }

      this.logger.log(`Vehicle deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting vehicle ${id}: ${error.message}`);
      throw error;
    }
  }

  private mapToResponseDto(vehicle: any): VehicleResponseDto {
    const today = new Date();
    const insuranceExpiry = new Date(vehicle.insurance_expiry_date);
    const lastMaintenance = new Date(vehicle.last_maintenance_date);

    const daysUntilInsuranceExpiry = Math.ceil(
      (insuranceExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysSinceLastMaintenance = Math.ceil(
      (today.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Generate display ID (VD001, VD002, etc.)
    const displayId = `VD${vehicle.id.slice(-3).toUpperCase()}`;

    // Mock data for UI requirements (you can replace with real data later)
    const lastTripOn = new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random date within last 7 days
    const currentLocation = vehicle.address || 'Collection Point Parking';
    const fuelLevel = Math.floor(Math.random() * 100); // Random fuel level 0-100
    const avgFuelConsumption = 15; // Mock average consumption

    // Mock tyre conditions (you can replace with real data later)
    const tyreConditions = [
      { tyrePosition: 'Front Left', condition: 80, pressure: 32, unit: 'psi' },
      { tyrePosition: 'Front Right', condition: 75, pressure: 31, unit: 'psi' },
      { tyrePosition: 'Rear Left', condition: 85, pressure: 33, unit: 'psi' },
      { tyrePosition: 'Rear Right', condition: 78, pressure: 30, unit: 'psi' },
    ];

    return {
      id: vehicle.id,
      name: vehicle.name,
      vehicleTypeId: vehicle.vehicle_type_id,
      vehicleTypeName: vehicle.vehicle_type_name,
      licensePlateNumber: vehicle.license_plate_number,
      registrationNumber: vehicle.registration_number,
      fuelTypeId: vehicle.fuel_type_id,
      fuelTypeName: vehicle.fuel_type_name,
      insuranceExpiryDate: vehicle.insurance_expiry_date,
      lastMaintenanceDate: vehicle.last_maintenance_date,
      enableGpsTracking: vehicle.enable_gps_tracking,
      assignedDriverId: vehicle.assigned_driver_id,
      assignedDriverName: vehicle.assigned_driver_name,
      assignedRegionId: vehicle.assigned_region_id,
      assignedRegionName: vehicle.assigned_region_name,
      assignedZoneId: vehicle.assigned_zone_id,
      assignedZoneName: vehicle.assigned_zone_name,
      assignedWardId: vehicle.assigned_ward_id,
      assignedWardName: vehicle.assigned_ward_name,
      status: vehicle.status,
      imageUrl: vehicle.image_url,
      address: vehicle.address,
      isActive: vehicle.is_active,
      tenantId: vehicle.tenant_id,
      createdBy: vehicle.created_by,
      createdAt: vehicle.created_at,
      updatedAt: vehicle.updated_at,
      daysUntilInsuranceExpiry,
      daysSinceLastMaintenance,
      // Additional fields for UI
      displayId,
      lastTripOn,
      currentLocation,
      fuelLevel,
      avgFuelConsumption,
      tyreConditions,
    };
  }
}
