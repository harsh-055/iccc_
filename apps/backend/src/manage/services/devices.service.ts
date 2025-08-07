import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
  DeviceResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    createDeviceDto: CreateDeviceDto,
    userId: string,
    tenantId: string,
  ): Promise<DeviceResponseDto> {
    try {
      // Check if device with same serial number already exists
      const existingDevice = await this.databaseService.query(
        'SELECT id FROM devices WHERE serial_number = $1 AND tenant_id = $2 AND is_active = true',
        [createDeviceDto.serialNumber, tenantId],
      );

      if (existingDevice.rows.length > 0) {
        throw new ConflictException(
          'Device with this serial number already exists',
        );
      }

      // Validate device type exists
      const deviceType = await this.databaseService.query(
        'SELECT id FROM device_types WHERE id = $1 AND is_active = true',
        [createDeviceDto.deviceTypeId],
      );

      if (deviceType.rows.length === 0) {
        throw new NotFoundException('Device type not found');
      }

      // Validate manufacturer exists
      const manufacturer = await this.databaseService.query(
        'SELECT id FROM manufacturers WHERE id = $1 AND is_active = true',
        [createDeviceDto.manufacturerId],
      );

      if (manufacturer.rows.length === 0) {
        throw new NotFoundException('Manufacturer not found');
      }

      // Validate site if provided
      if (createDeviceDto.assignedSiteId) {
        const site = await this.databaseService.query(
          'SELECT id FROM sites WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createDeviceDto.assignedSiteId, tenantId],
        );

        if (site.rows.length === 0) {
          throw new NotFoundException('Site not found');
        }
      }

      const result = await this.databaseService.query(
        `INSERT INTO devices (
          name, device_type_id, manufacturer_id, serial_number, model, firmware_version,
          status, installation_date, last_maintenance_date, battery_level, signal_strength,
          enable_gps_tracking, assigned_site_id, address, latitude, longitude, description,
          tenant_id, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          createDeviceDto.name,
          createDeviceDto.deviceTypeId,
          createDeviceDto.manufacturerId,
          createDeviceDto.serialNumber,
          createDeviceDto.model,
          createDeviceDto.firmwareVersion,
          createDeviceDto.status,
          createDeviceDto.installationDate,
          createDeviceDto.lastMaintenanceDate,
          createDeviceDto.batteryLevel,
          createDeviceDto.signalStrength,
          createDeviceDto.enableGpsTracking ?? true,
          createDeviceDto.assignedSiteId,
          createDeviceDto.address,
          createDeviceDto.latitude,
          createDeviceDto.longitude,
          createDeviceDto.description,
          tenantId,
          userId,
        ],
      );

      const device = result.rows[0];
      this.logger.log(`Device created: ${device.id}`);

      return this.mapToResponseDto(device);
    } catch (error) {
      this.logger.error(`Error creating device: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto: BaseFilterDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<DeviceResponseDto>> {
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
      const whereConditions = ['d.tenant_id = $1'];
      const queryParams = [tenantId];
      let paramIndex = 2;

      if (filterDto.isActive !== undefined) {
        whereConditions.push(`d.is_active = $${paramIndex}`);
        queryParams.push(filterDto.isActive.toString());
        paramIndex++;
      }

      if (filterDto.status) {
        whereConditions.push(`d.status = $${paramIndex}`);
        queryParams.push(filterDto.status);
        paramIndex++;
      }

      if (filterDto.assignedSiteId) {
        whereConditions.push(`d.assigned_site_id = $${paramIndex}`);
        queryParams.push(filterDto.assignedSiteId);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(
          `(d.name ILIKE $${paramIndex} OR d.serial_number ILIKE $${paramIndex} OR d.model ILIKE $${paramIndex})`,
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
        FROM devices d
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
          d.*,
          dt.name as device_type_name,
          m.name as manufacturer_name,
          s.name as assigned_site_name,
          COALESCE(alerts_count.count, 0) as active_alerts_count
        FROM devices d
        LEFT JOIN device_types dt ON d.device_type_id = dt.id
        LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
        LEFT JOIN sites s ON d.assigned_site_id = s.id
        LEFT JOIN (
          SELECT device_id, COUNT(*) as count 
          FROM device_alerts 
          WHERE is_active = true AND status = 'Active'
          GROUP BY device_id
        ) alerts_count ON d.id = alerts_count.device_id
        ${whereClause}
        ORDER BY d.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataResult = await this.databaseService.query(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const devices = dataResult.rows.map((row) => this.mapToResponseDto(row));

      return {
        data: devices,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error(`Error fetching devices: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, tenantId: string): Promise<DeviceResponseDto> {
    try {
      const result = await this.databaseService.query(
        `SELECT 
          d.*,
          dt.name as device_type_name,
          m.name as manufacturer_name,
          s.name as assigned_site_name,
          COALESCE(alerts_count.count, 0) as active_alerts_count
        FROM devices d
        LEFT JOIN device_types dt ON d.device_type_id = dt.id
        LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
        LEFT JOIN sites s ON d.assigned_site_id = s.id
        LEFT JOIN (
          SELECT device_id, COUNT(*) as count 
          FROM device_alerts 
          WHERE is_active = true AND status = 'Active'
          GROUP BY device_id
        ) alerts_count ON d.id = alerts_count.device_id
        WHERE d.id = $1 AND d.tenant_id = $2`,
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Device not found');
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error fetching device ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateDeviceDto: UpdateDeviceDto,
    userId: string,
    tenantId: string,
  ): Promise<DeviceResponseDto> {
    try {
      // Check if device exists
      const existingDevice = await this.findOne(id, tenantId);

      // Check if serial number is being updated and if it conflicts
      if (
        updateDeviceDto.serialNumber &&
        updateDeviceDto.serialNumber !== existingDevice.serialNumber
      ) {
        const serialConflict = await this.databaseService.query(
          'SELECT id FROM devices WHERE serial_number = $1 AND tenant_id = $2 AND id != $3 AND is_active = true',
          [updateDeviceDto.serialNumber, tenantId, id],
        );

        if (serialConflict.rows.length > 0) {
          throw new ConflictException(
            'Device with this serial number already exists',
          );
        }
      }

      // Validate device type if being updated
      if (updateDeviceDto.deviceTypeId) {
        const deviceType = await this.databaseService.query(
          'SELECT id FROM device_types WHERE id = $1 AND is_active = true',
          [updateDeviceDto.deviceTypeId],
        );

        if (deviceType.rows.length === 0) {
          throw new NotFoundException('Device type not found');
        }
      }

      // Validate manufacturer if being updated
      if (updateDeviceDto.manufacturerId) {
        const manufacturer = await this.databaseService.query(
          'SELECT id FROM manufacturers WHERE id = $1 AND is_active = true',
          [updateDeviceDto.manufacturerId],
        );

        if (manufacturer.rows.length === 0) {
          throw new NotFoundException('Manufacturer not found');
        }
      }

      // Validate site if being updated
      if (updateDeviceDto.assignedSiteId) {
        const site = await this.databaseService.query(
          'SELECT id FROM sites WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateDeviceDto.assignedSiteId, tenantId],
        );

        if (site.rows.length === 0) {
          throw new NotFoundException('Site not found');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (updateDeviceDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        queryParams.push(updateDeviceDto.name);
        paramIndex++;
      }

      if (updateDeviceDto.deviceTypeId !== undefined) {
        updateFields.push(`device_type_id = $${paramIndex}`);
        queryParams.push(updateDeviceDto.deviceTypeId);
        paramIndex++;
      }

      if (updateDeviceDto.manufacturerId !== undefined) {
        updateFields.push(`manufacturer_id = $${paramIndex}`);
        queryParams.push(updateDeviceDto.manufacturerId);
        paramIndex++;
      }

      if (updateDeviceDto.serialNumber !== undefined) {
        updateFields.push(`serial_number = $${paramIndex}`);
        queryParams.push(updateDeviceDto.serialNumber);
        paramIndex++;
      }

      if (updateDeviceDto.model !== undefined) {
        updateFields.push(`model = $${paramIndex}`);
        queryParams.push(updateDeviceDto.model);
        paramIndex++;
      }

      if (updateDeviceDto.firmwareVersion !== undefined) {
        updateFields.push(`firmware_version = $${paramIndex}`);
        queryParams.push(updateDeviceDto.firmwareVersion);
        paramIndex++;
      }

      if (updateDeviceDto.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        queryParams.push(updateDeviceDto.status);
        paramIndex++;
      }

      if (updateDeviceDto.installationDate !== undefined) {
        updateFields.push(`installation_date = $${paramIndex}`);
        queryParams.push(updateDeviceDto.installationDate);
        paramIndex++;
      }

      if (updateDeviceDto.lastMaintenanceDate !== undefined) {
        updateFields.push(`last_maintenance_date = $${paramIndex}`);
        queryParams.push(updateDeviceDto.lastMaintenanceDate);
        paramIndex++;
      }

      if (updateDeviceDto.batteryLevel !== undefined) {
        updateFields.push(`battery_level = $${paramIndex}`);
        queryParams.push(updateDeviceDto.batteryLevel);
        paramIndex++;
      }

      if (updateDeviceDto.signalStrength !== undefined) {
        updateFields.push(`signal_strength = $${paramIndex}`);
        queryParams.push(updateDeviceDto.signalStrength);
        paramIndex++;
      }

      if (updateDeviceDto.enableGpsTracking !== undefined) {
        updateFields.push(`enable_gps_tracking = $${paramIndex}`);
        queryParams.push(updateDeviceDto.enableGpsTracking);
        paramIndex++;
      }

      if (updateDeviceDto.assignedSiteId !== undefined) {
        updateFields.push(`assigned_site_id = $${paramIndex}`);
        queryParams.push(updateDeviceDto.assignedSiteId);
        paramIndex++;
      }

      if (updateDeviceDto.address !== undefined) {
        updateFields.push(`address = $${paramIndex}`);
        queryParams.push(updateDeviceDto.address);
        paramIndex++;
      }

      if (updateDeviceDto.latitude !== undefined) {
        updateFields.push(`latitude = $${paramIndex}`);
        queryParams.push(updateDeviceDto.latitude);
        paramIndex++;
      }

      if (updateDeviceDto.longitude !== undefined) {
        updateFields.push(`longitude = $${paramIndex}`);
        queryParams.push(updateDeviceDto.longitude);
        paramIndex++;
      }

      if (updateDeviceDto.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        queryParams.push(updateDeviceDto.description);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return existingDevice;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await this.databaseService.query(
        `UPDATE devices 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
         RETURNING *`,
        [...queryParams, id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Device not found');
      }

      this.logger.log(`Device updated: ${id}`);
      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating device ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    try {
      // Check if device has any active alerts
      const alertsResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM device_alerts WHERE device_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(alertsResult.rows[0].count) > 0) {
        throw new ConflictException('Cannot delete device with active alerts');
      }

      const result = await this.databaseService.query(
        'DELETE FROM devices WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Device not found');
      }

      this.logger.log(`Device deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting device ${id}: ${error.message}`);
      throw error;
    }
  }

  private mapToResponseDto(device: any): DeviceResponseDto {
    const today = new Date();
    const lastMaintenance = new Date(device.last_maintenance_date);
    const daysSinceLastMaintenance = Math.ceil(
      (today.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: device.id,
      name: device.name,
      deviceTypeId: device.device_type_id,
      deviceTypeName: device.device_type_name,
      manufacturerId: device.manufacturer_id,
      manufacturerName: device.manufacturer_name,
      serialNumber: device.serial_number,
      model: device.model,
      firmwareVersion: device.firmware_version,
      status: device.status,
      installationDate: device.installation_date,
      lastMaintenanceDate: device.last_maintenance_date,
      batteryLevel: device.battery_level,
      signalStrength: device.signal_strength,
      enableGpsTracking: device.enable_gps_tracking,
      assignedSiteId: device.assigned_site_id,
      assignedSiteName: device.assigned_site_name,
      address: device.address,
      latitude: device.latitude,
      longitude: device.longitude,
      description: device.description,
      isActive: device.is_active,
      tenantId: device.tenant_id,
      createdBy: device.created_by,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
      daysSinceLastMaintenance,
      activeAlertsCount: parseInt(device.active_alerts_count) || 0,
    };
  }
}
