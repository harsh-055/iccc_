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
      // Check if device with same device_id already exists
      const existingDevice = await this.databaseService.query(
        'SELECT id FROM devices WHERE device_id = $1 AND tenant_id = $2 AND is_active = true',
        [createDeviceDto.deviceId, tenantId],
      );

      if (existingDevice.rows.length > 0) {
        throw new ConflictException(
          'Device with this device ID already exists',
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

      // Validate zone if provided
      if (createDeviceDto.zoneId) {
        const zone = await this.databaseService.query(
          'SELECT id FROM zones WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createDeviceDto.zoneId, tenantId],
        );

        if (zone.rows.length === 0) {
          throw new NotFoundException('Zone not found');
        }
      }

      // Validate ward if provided
      if (createDeviceDto.wardId) {
        const ward = await this.databaseService.query(
          'SELECT id FROM wards WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createDeviceDto.wardId, tenantId],
        );

        if (ward.rows.length === 0) {
          throw new NotFoundException('Ward not found');
        }
      }

      // Validate node if provided
      if (createDeviceDto.nodeId) {
        const node = await this.databaseService.query(
          'SELECT id FROM nodes WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createDeviceDto.nodeId, tenantId],
        );

        if (node.rows.length === 0) {
          throw new NotFoundException('Node not found');
        }
      }

      // Validate site if provided
      if (createDeviceDto.siteId) {
        const site = await this.databaseService.query(
          'SELECT id FROM sites WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createDeviceDto.siteId, tenantId],
        );

        if (site.rows.length === 0) {
          throw new NotFoundException('Site not found');
        }
      }

      const result = await this.databaseService.query(
        `INSERT INTO devices (
          device_name, device_id, device_type_id, node_id, status, zone_id, ward_id, site_id,
          device_location, manufacturer_id, installed_on, warranty_expiry_date,
          health_status, http_port, base_ip_address, start_ip_address, end_ip_address,
          multicasting_enabled, image_url, address, latitude, longitude,
          tenant_id, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING *`,
        [
          createDeviceDto.deviceName,
          createDeviceDto.deviceId,
          createDeviceDto.deviceTypeId,
          createDeviceDto.nodeId,
          createDeviceDto.status || 'Inactive',
          createDeviceDto.zoneId,
          createDeviceDto.wardId,
          createDeviceDto.siteId,
          createDeviceDto.deviceLocation,
          createDeviceDto.manufacturerId,
          createDeviceDto.installedOn,
          createDeviceDto.warrantyExpiryDate,
          createDeviceDto.healthStatus || 'Good',
          createDeviceDto.httpPort,
          createDeviceDto.baseIpAddress,
          createDeviceDto.startIpAddress,
          createDeviceDto.endIpAddress,
          createDeviceDto.multicastingEnabled || false,
          createDeviceDto.imageUrl,
          createDeviceDto.address,
          createDeviceDto.latitude,
          createDeviceDto.longitude,
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

      if (filterDto.zoneId) {
        whereConditions.push(`d.zone_id = $${paramIndex}`);
        queryParams.push(filterDto.zoneId);
        paramIndex++;
      }

      if (filterDto.wardId) {
        whereConditions.push(`d.ward_id = $${paramIndex}`);
        queryParams.push(filterDto.wardId);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(
          `(d.device_name ILIKE $${paramIndex} OR d.device_id ILIKE $${paramIndex} OR d.device_location ILIKE $${paramIndex} OR d.address ILIKE $${paramIndex})`,
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
          z.name as zone_name,
          w.name as ward_name,
          n.name as node_name,
          s.name as site_name,
          COALESCE(alerts_count.count, 0) as active_alerts_count
        FROM devices d
        LEFT JOIN device_types dt ON d.device_type_id = dt.id
        LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
        LEFT JOIN zones z ON d.zone_id = z.id
        LEFT JOIN wards w ON d.ward_id = w.id
        LEFT JOIN nodes n ON d.node_id = n.id
        LEFT JOIN sites s ON d.site_id = s.id
        LEFT JOIN (
          SELECT device_id, COUNT(*) as count 
          FROM device_alerts 
          WHERE is_resolved = false
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
          z.name as zone_name,
          w.name as ward_name,
          n.name as node_name,
          s.name as site_name,
          COALESCE(alerts_count.count, 0) as active_alerts_count
        FROM devices d
        LEFT JOIN device_types dt ON d.device_type_id = dt.id
        LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
        LEFT JOIN zones z ON d.zone_id = z.id
        LEFT JOIN wards w ON d.ward_id = w.id
        LEFT JOIN nodes n ON d.node_id = n.id
        LEFT JOIN sites s ON d.site_id = s.id
        LEFT JOIN (
          SELECT device_id, COUNT(*) as count 
          FROM device_alerts 
          WHERE is_resolved = false
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

      // Check if device ID is being updated and if it conflicts
      if (
        updateDeviceDto.deviceId &&
        updateDeviceDto.deviceId !== existingDevice.deviceId
      ) {
        const deviceIdConflict = await this.databaseService.query(
          'SELECT id FROM devices WHERE device_id = $1 AND tenant_id = $2 AND id != $3 AND is_active = true',
          [updateDeviceDto.deviceId, tenantId, id],
        );

        if (deviceIdConflict.rows.length > 0) {
          throw new ConflictException(
            'Device with this device ID already exists',
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

      // Validate zone if being updated
      if (updateDeviceDto.zoneId) {
        const zone = await this.databaseService.query(
          'SELECT id FROM zones WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateDeviceDto.zoneId, tenantId],
        );

        if (zone.rows.length === 0) {
          throw new NotFoundException('Zone not found');
        }
      }

      // Validate ward if being updated
      if (updateDeviceDto.wardId) {
        const ward = await this.databaseService.query(
          'SELECT id FROM wards WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateDeviceDto.wardId, tenantId],
        );

        if (ward.rows.length === 0) {
          throw new NotFoundException('Ward not found');
        }
      }

      // Validate node if being updated
      if (updateDeviceDto.nodeId) {
        const node = await this.databaseService.query(
          'SELECT id FROM nodes WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateDeviceDto.nodeId, tenantId],
        );

        if (node.rows.length === 0) {
          throw new NotFoundException('Node not found');
        }
      }

      // Validate site if being updated
      if (updateDeviceDto.siteId) {
        const site = await this.databaseService.query(
          'SELECT id FROM sites WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateDeviceDto.siteId, tenantId],
        );

        if (site.rows.length === 0) {
          throw new NotFoundException('Site not found');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (updateDeviceDto.deviceName !== undefined) {
        updateFields.push(`device_name = $${paramIndex}`);
        queryParams.push(updateDeviceDto.deviceName);
        paramIndex++;
      }

      if (updateDeviceDto.deviceId !== undefined) {
        updateFields.push(`device_id = $${paramIndex}`);
        queryParams.push(updateDeviceDto.deviceId);
        paramIndex++;
      }

      if (updateDeviceDto.deviceTypeId !== undefined) {
        updateFields.push(`device_type_id = $${paramIndex}`);
        queryParams.push(updateDeviceDto.deviceTypeId);
        paramIndex++;
      }

      if (updateDeviceDto.nodeId !== undefined) {
        updateFields.push(`node_id = $${paramIndex}`);
        queryParams.push(updateDeviceDto.nodeId);
        paramIndex++;
      }

      if (updateDeviceDto.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        queryParams.push(updateDeviceDto.status);
        paramIndex++;
      }

      if (updateDeviceDto.zoneId !== undefined) {
        updateFields.push(`zone_id = $${paramIndex}`);
        queryParams.push(updateDeviceDto.zoneId);
        paramIndex++;
      }

      if (updateDeviceDto.wardId !== undefined) {
        updateFields.push(`ward_id = $${paramIndex}`);
        queryParams.push(updateDeviceDto.wardId);
        paramIndex++;
      }

      if (updateDeviceDto.siteId !== undefined) {
        updateFields.push(`site_id = $${paramIndex}`);
        queryParams.push(updateDeviceDto.siteId);
        paramIndex++;
      }

      if (updateDeviceDto.deviceLocation !== undefined) {
        updateFields.push(`device_location = $${paramIndex}`);
        queryParams.push(updateDeviceDto.deviceLocation);
        paramIndex++;
      }

      if (updateDeviceDto.manufacturerId !== undefined) {
        updateFields.push(`manufacturer_id = $${paramIndex}`);
        queryParams.push(updateDeviceDto.manufacturerId);
        paramIndex++;
      }

      if (updateDeviceDto.installedOn !== undefined) {
        updateFields.push(`installed_on = $${paramIndex}`);
        queryParams.push(updateDeviceDto.installedOn);
        paramIndex++;
      }

      if (updateDeviceDto.warrantyExpiryDate !== undefined) {
        updateFields.push(`warranty_expiry_date = $${paramIndex}`);
        queryParams.push(updateDeviceDto.warrantyExpiryDate);
        paramIndex++;
      }

      if (updateDeviceDto.healthStatus !== undefined) {
        updateFields.push(`health_status = $${paramIndex}`);
        queryParams.push(updateDeviceDto.healthStatus);
        paramIndex++;
      }

      if (updateDeviceDto.httpPort !== undefined) {
        updateFields.push(`http_port = $${paramIndex}`);
        queryParams.push(updateDeviceDto.httpPort);
        paramIndex++;
      }

      if (updateDeviceDto.baseIpAddress !== undefined) {
        updateFields.push(`base_ip_address = $${paramIndex}`);
        queryParams.push(updateDeviceDto.baseIpAddress);
        paramIndex++;
      }

      if (updateDeviceDto.startIpAddress !== undefined) {
        updateFields.push(`start_ip_address = $${paramIndex}`);
        queryParams.push(updateDeviceDto.startIpAddress);
        paramIndex++;
      }

      if (updateDeviceDto.endIpAddress !== undefined) {
        updateFields.push(`end_ip_address = $${paramIndex}`);
        queryParams.push(updateDeviceDto.endIpAddress);
        paramIndex++;
      }

      if (updateDeviceDto.multicastingEnabled !== undefined) {
        updateFields.push(`multicasting_enabled = $${paramIndex}`);
        queryParams.push(updateDeviceDto.multicastingEnabled);
        paramIndex++;
      }

      if (updateDeviceDto.imageUrl !== undefined) {
        updateFields.push(`image_url = $${paramIndex}`);
        queryParams.push(updateDeviceDto.imageUrl);
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
    return {
      id: device.id,
      deviceName: device.device_name,
      deviceId: device.device_id,
      deviceTypeId: device.device_type_id,
      deviceTypeName: device.device_type_name,
      nodeId: device.node_id,
      nodeName: device.node_name,
      status: device.status,
      zoneId: device.zone_id,
      zoneName: device.zone_name,
      wardId: device.ward_id,
      wardName: device.ward_name,
      siteId: device.site_id,
      siteName: device.site_name,
      deviceLocation: device.device_location,
      manufacturerId: device.manufacturer_id,
      manufacturerName: device.manufacturer_name,
      installedOn: device.installed_on,
      warrantyExpiryDate: device.warranty_expiry_date,
      healthStatus: device.health_status,
      httpPort: device.http_port,
      baseIpAddress: device.base_ip_address,
      startIpAddress: device.start_ip_address,
      endIpAddress: device.end_ip_address,
      multicastingEnabled: device.multicasting_enabled,
      imageUrl: device.image_url,
      address: device.address,
      latitude: device.latitude,
      longitude: device.longitude,
      isActive: device.is_active,
      tenantId: device.tenant_id,
      createdBy: device.created_by,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
      activeAlertsCount: parseInt(device.active_alerts_count) || 0,
    };
  }
}
