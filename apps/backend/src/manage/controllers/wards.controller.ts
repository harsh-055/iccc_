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
import { WardsService } from '../services/wards.service';
import {
  CreateWardDto,
  UpdateWardDto,
  WardResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';
import { AuthPermissionGuard } from '../../permissions/guards/auth-permission.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permission.decorator';

@Controller('manage/wards')
@ApiTags('Manage - Wards')
@ApiBearerAuth('Bearer')
@UseGuards(AuthPermissionGuard)
export class WardsController {
  private readonly logger = new Logger(WardsController.name);

  constructor(private readonly wardsService: WardsService) {}

  @Post()
  @RequirePermissions('manage:wards:create')
  @ApiOperation({ summary: 'Create a new ward' })
  @ApiResponse({
    status: 201,
    description: 'Ward created successfully',
    type: WardResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Zone not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Ward name already exists in zone',
  })
  @ApiBody({
    type: CreateWardDto,
    description: 'Ward creation data',
    examples: {
      basic: {
        summary: 'Create basic ward',
        value: {
          name: 'Ward 1',
          description: 'Primary waste collection ward',
          zoneId: 'uuid-string',
          isActive: true,
        },
      },
    },
  })
  async create(@Body() createWardDto: CreateWardDto, @Req() req: any) {
    try {
      const result = await this.wardsService.create(
        createWardDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Ward created successfully: ${result.name}`,
        'WardsController',
        result.id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error creating ward: ${error.message}`,
        error.stack,
        'WardsController',
      );
      throw error;
    }
  }

  @Get()
  @RequirePermissions('manage:wards:read')
  @ApiOperation({ summary: 'Get all wards with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Wards retrieved successfully',
    type: PaginatedResponseDto<WardResponseDto>,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Ward' })
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
    name: 'zoneId',
    required: false,
    type: String,
    example: 'uuid-string',
  })
  @ApiQuery({
    name: 'regionId',
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
      const result = await this.wardsService.findAll(
        paginationDto,
        filterDto,
        req.user.tenantId,
      );

      this.logger.log(
        `Wards retrieved successfully: ${result.total} total, ${result.data.length} on page`,
        'WardsController',
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching wards: ${error.message}`,
        error.stack,
        'WardsController',
      );
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('manage:wards:read')
  @ApiOperation({ summary: 'Get a specific ward by ID' })
  @ApiResponse({
    status: 200,
    description: 'Ward retrieved successfully',
    type: WardResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Ward not found' })
  @ApiParam({
    name: 'id',
    description: 'Ward ID',
    type: 'string',
    format: 'uuid',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      const result = await this.wardsService.findOne(id, req.user.tenantId);

      this.logger.log(
        `Ward retrieved successfully: ${result.name}`,
        'WardsController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching ward ${id}: ${error.message}`,
        error.stack,
        'WardsController',
      );
      throw error;
    }
  }

  @Patch(':id')
  @RequirePermissions('manage:wards:update')
  @ApiOperation({ summary: 'Update a ward' })
  @ApiResponse({
    status: 200,
    description: 'Ward updated successfully',
    type: WardResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Ward not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Ward name already exists in zone',
  })
  @ApiParam({
    name: 'id',
    description: 'Ward ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateWardDto,
    description: 'Ward update data',
    examples: {
      basic: {
        summary: 'Update ward name',
        value: {
          name: 'Updated Ward Name',
          description: 'Updated description',
        },
      },
      deactivate: {
        summary: 'Deactivate ward',
        value: {
          isActive: false,
        },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWardDto: UpdateWardDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.wardsService.update(
        id,
        updateWardDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Ward updated successfully: ${result.name}`,
        'WardsController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error updating ward ${id}: ${error.message}`,
        error.stack,
        'WardsController',
      );
      throw error;
    }
  }

  @Delete(':id')
  @RequirePermissions('manage:wards:delete')
  @ApiOperation({ summary: 'Delete a ward' })
  @ApiResponse({ status: 200, description: 'Ward deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Ward not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Ward has active sites/vehicles/workforce',
  })
  @ApiParam({
    name: 'id',
    description: 'Ward ID',
    type: 'string',
    format: 'uuid',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      await this.wardsService.remove(id, req.user.tenantId);

      this.logger.log(`Ward deleted successfully`, 'WardsController', id);

      return { message: 'Ward deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting ward ${id}: ${error.message}`,
        error.stack,
        'WardsController',
      );
      throw error;
    }
  }
}
