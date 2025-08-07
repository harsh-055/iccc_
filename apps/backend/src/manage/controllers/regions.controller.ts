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
import { RegionsService } from '../services/regions.service';
import {
  CreateRegionDto,
  UpdateRegionDto,
  RegionResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';
import { AuthPermissionGuard } from '../../permissions/guards/auth-permission.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permission.decorator';
import { Public } from '../../permissions/decorators/public.decorators';

@Controller('manage/regions')
@ApiTags('Manage - Regions')
@ApiBearerAuth('Bearer')
@UseGuards(AuthPermissionGuard)
export class RegionsController {
  private readonly logger = new Logger(RegionsController.name);

  constructor(private readonly regionsService: RegionsService) {}

  @Post()
  @RequirePermissions('manage:regions:create')
  @ApiOperation({ summary: 'Create a new region' })
  @ApiResponse({
    status: 201,
    description: 'Region created successfully',
    type: RegionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Region name already exists',
  })
  @ApiBody({
    type: CreateRegionDto,
    description: 'Region creation data',
    examples: {
      basic: {
        summary: 'Create basic region',
        value: {
          name: 'Region 1',
          description: 'Primary waste management region',
          isActive: true,
        },
      },
    },
  })
  async create(@Body() createRegionDto: CreateRegionDto, @Req() req: any) {
    try {
      const result = await this.regionsService.create(
        createRegionDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Region created successfully: ${result.name}`,
        'RegionsController',
        result.id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error creating region: ${error.message}`,
        error.stack,
        'RegionsController',
      );
      throw error;
    }
  }

  @Get()
  @RequirePermissions('manage:regions:read')
  @ApiOperation({ summary: 'Get all regions with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Regions retrieved successfully',
    type: PaginatedResponseDto<RegionResponseDto>,
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
    example: 'Region',
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
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: BaseFilterDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.regionsService.findAll(
        paginationDto,
        filterDto,
        req.user.tenantId,
      );

      this.logger.log(
        `Regions retrieved successfully: ${result.total} total, ${result.data.length} on page`,
        'RegionsController',
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching regions: ${error.message}`,
        error.stack,
        'RegionsController',
      );
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('manage:regions:read')
  @ApiOperation({ summary: 'Get a specific region by ID' })
  @ApiResponse({
    status: 200,
    description: 'Region retrieved successfully',
    type: RegionResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Region not found' })
  @ApiParam({
    name: 'id',
    description: 'Region ID',
    type: 'string',
    format: 'uuid',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      const result = await this.regionsService.findOne(id, req.user.tenantId);

      this.logger.log(
        `Region retrieved successfully: ${result.name}`,
        'RegionsController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching region ${id}: ${error.message}`,
        error.stack,
        'RegionsController',
      );
      throw error;
    }
  }

  @Patch(':id')
  @RequirePermissions('manage:regions:update')
  @ApiOperation({ summary: 'Update a region' })
  @ApiResponse({
    status: 200,
    description: 'Region updated successfully',
    type: RegionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Region not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Region name already exists',
  })
  @ApiParam({
    name: 'id',
    description: 'Region ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateRegionDto,
    description: 'Region update data',
    examples: {
      basic: {
        summary: 'Update region name',
        value: {
          name: 'Updated Region Name',
          description: 'Updated description',
        },
      },
      deactivate: {
        summary: 'Deactivate region',
        value: {
          isActive: false,
        },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRegionDto: UpdateRegionDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.regionsService.update(
        id,
        updateRegionDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Region updated successfully: ${result.name}`,
        'RegionsController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error updating region ${id}: ${error.message}`,
        error.stack,
        'RegionsController',
      );
      throw error;
    }
  }

  @Delete(':id')
  @RequirePermissions('manage:regions:delete')
  @ApiOperation({ summary: 'Delete a region' })
  @ApiResponse({ status: 200, description: 'Region deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Region not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Region has active zones/sites/vehicles',
  })
  @ApiParam({
    name: 'id',
    description: 'Region ID',
    type: 'string',
    format: 'uuid',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      await this.regionsService.remove(id, req.user.tenantId);

      this.logger.log(`Region deleted successfully`, 'RegionsController', id);

      return { message: 'Region deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting region ${id}: ${error.message}`,
        error.stack,
        'RegionsController',
      );
      throw error;
    }
  }
}
