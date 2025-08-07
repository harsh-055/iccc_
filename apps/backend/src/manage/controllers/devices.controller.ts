import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Logger,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DevicesService } from '../services/devices.service';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
  DeviceResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';
import { AuthPermissionGuard } from '../../permissions/guards/auth-permission.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permission.decorator';

@Controller('manage/devices')
@ApiTags('Manage - Devices')
@ApiBearerAuth('Bearer')
@UseGuards(AuthPermissionGuard)
export class DevicesController {
  private readonly logger = new Logger(DevicesController.name);

  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @RequirePermissions('manage:devices:create')
  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponse({
    status: 201,
    description: 'Device created successfully',
    type: DeviceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Device type/manufacturer/site not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Device serial number already exists',
  })
  @ApiBody({
    type: CreateDeviceDto,
    description: 'Device creation data',
    examples: {
      basic: {
        summary: 'Create basic device',
        value: {
          name: 'Smart Bin Sensor 001',
          deviceTypeId: 'uuid-string',
          manufacturerId: 'uuid-string',
          serialNumber: 'SN123456789',
          model: 'IoT-Bin-Sensor-v2.0',
          firmwareVersion: 'v1.2.3',
          status: 'Inactive',
          installationDate: '2024-01-15',
          lastMaintenanceDate: '2024-01-15',
          batteryLevel: 85,
          signalStrength: 90,
          enableGpsTracking: true,
          assignedSiteId: 'uuid-string',
          address: 'Near Central Park, Main Street',
          latitude: 12.9716,
          longitude: 77.5946,
          description: 'Smart waste bin sensor with IoT capabilities',
        },
      },
    },
  })
  async create(@Body() createDeviceDto: CreateDeviceDto, @Req() req: any) {
    try {
      const result = await this.devicesService.create(
        createDeviceDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Device created successfully: ${result.name}`,
        'DevicesController',
        result.id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error creating device: ${error.message}`,
        error.stack,
        'DevicesController',
      );
      throw error;
    }
  }

  @Get()
  @RequirePermissions('manage:devices:read')
  @ApiOperation({ summary: 'Get all devices with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Devices retrieved successfully',
    type: PaginatedResponseDto<DeviceResponseDto>,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Smart Bin',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'created_at',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, example: true })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    example: 'Active',
  })
  @ApiQuery({
    name: 'assignedSiteId',
    required: false,
    type: String,
    example: 'uuid-string',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: BaseFilterDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.devicesService.findAll(
        paginationDto,
        filterDto,
        req.user.tenantId,
      );

      this.logger.log(
        `Devices retrieved successfully: ${result.total} total, ${result.data.length} on page`,
        'DevicesController',
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching devices: ${error.message}`,
        error.stack,
        'DevicesController',
      );
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('manage:devices:read')
  @ApiOperation({ summary: 'Get a specific device by ID' })
  @ApiResponse({
    status: 200,
    description: 'Device retrieved successfully',
    type: DeviceResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Device not found' })
  @ApiParam({
    name: 'id',
    description: 'Device ID',
    type: 'string',
    format: 'uuid',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      const result = await this.devicesService.findOne(id, req.user.tenantId);

      this.logger.log(
        `Device retrieved successfully: ${result.name}`,
        'DevicesController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching device ${id}: ${error.message}`,
        error.stack,
        'DevicesController',
      );
      throw error;
    }
  }

  @Patch(':id')
  @RequirePermissions('manage:devices:update')
  @ApiOperation({ summary: 'Update a device' })
  @ApiResponse({
    status: 200,
    description: 'Device updated successfully',
    type: DeviceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Device not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Device serial number already exists',
  })
  @ApiParam({
    name: 'id',
    description: 'Device ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateDeviceDto,
    description: 'Device update data',
    examples: {
      basic: {
        summary: 'Update device status and battery level',
        value: {
          status: 'Active',
          batteryLevel: 75,
          signalStrength: 85,
        },
      },
      maintenance: {
        summary: 'Update maintenance date',
        value: {
          lastMaintenanceDate: '2024-02-15',
          status: 'Maintenance',
        },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.devicesService.update(
        id,
        updateDeviceDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Device updated successfully: ${result.name}`,
        'DevicesController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error updating device ${id}: ${error.message}`,
        error.stack,
        'DevicesController',
      );
      throw error;
    }
  }

  @Delete(':id')
  @RequirePermissions('manage:devices:delete')
  @ApiOperation({ summary: 'Delete a device' })
  @ApiResponse({ status: 200, description: 'Device deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Device not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Device has active alerts',
  })
  @ApiParam({
    name: 'id',
    description: 'Device ID',
    type: 'string',
    format: 'uuid',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      await this.devicesService.remove(id, req.user.tenantId);

      this.logger.log(`Device deleted successfully`, 'DevicesController', id);

      return { message: 'Device deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting device ${id}: ${error.message}`,
        error.stack,
        'DevicesController',
      );
      throw error;
    }
  }
}
