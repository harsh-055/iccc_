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
import { InventoryService } from '../services/inventory.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  InventoryItemResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';
import { AuthPermissionGuard } from '../../permissions/guards/auth-permission.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permission.decorator';

@Controller('manage/inventory')
@ApiTags('Manage - Inventory')
@ApiBearerAuth('Bearer')
@UseGuards(AuthPermissionGuard)
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @RequirePermissions('manage:inventory:create')
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({
    status: 201,
    description: 'Inventory item created successfully',
    type: InventoryItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Site not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Item SKU already exists',
  })
  @ApiBody({
    type: CreateInventoryItemDto,
    description: 'Inventory item creation data',
    examples: {
      basic: {
        summary: 'Create basic inventory item',
        value: {
          name: 'Safety Gloves',
          description: 'High-quality safety gloves for waste collection',
          category: 'Safety Equipment',
          sku: 'SG-001',
          unit: 'pieces',
          currentStock: 100,
          minStockLevel: 20,
          maxStockLevel: 200,
          unitPrice: 15.5,
          supplier: 'Safety Supplies Co.',
          supplierContact: 'contact@safetysupplies.com',
          location: 'Warehouse A, Shelf 3',
          isActive: true,
          imageUrl: 'https://example.com/safety-gloves.jpg',
          assignedSiteId: 'uuid-string',
        },
      },
    },
  })
  async create(
    @Body() createInventoryItemDto: CreateInventoryItemDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.inventoryService.create(
        createInventoryItemDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Inventory item created successfully: ${result.name}`,
        'InventoryController',
        result.id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error creating inventory item: ${error.message}`,
        error.stack,
        'InventoryController',
      );
      throw error;
    }
  }

  @Get()
  @RequirePermissions('manage:inventory:read')
  @ApiOperation({
    summary: 'Get all inventory items with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory items retrieved successfully',
    type: PaginatedResponseDto<InventoryItemResponseDto>,
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
    example: 'Safety Gloves',
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
    name: 'category',
    required: false,
    type: String,
    example: 'Safety Equipment',
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
      const result = await this.inventoryService.findAll(
        paginationDto,
        filterDto,
        req.user.tenantId,
      );

      this.logger.log(
        `Inventory items retrieved successfully: ${result.total} total, ${result.data.length} on page`,
        'InventoryController',
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching inventory items: ${error.message}`,
        error.stack,
        'InventoryController',
      );
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('manage:inventory:read')
  @ApiOperation({ summary: 'Get a specific inventory item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item retrieved successfully',
    type: InventoryItemResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Inventory item not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Inventory item ID',
    type: 'string',
    format: 'uuid',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      const result = await this.inventoryService.findOne(id, req.user.tenantId);

      this.logger.log(
        `Inventory item retrieved successfully: ${result.name}`,
        'InventoryController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching inventory item ${id}: ${error.message}`,
        error.stack,
        'InventoryController',
      );
      throw error;
    }
  }

  @Patch(':id')
  @RequirePermissions('manage:inventory:update')
  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item updated successfully',
    type: InventoryItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Inventory item not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Item SKU already exists',
  })
  @ApiParam({
    name: 'id',
    description: 'Inventory item ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateInventoryItemDto,
    description: 'Inventory item update data',
    examples: {
      basic: {
        summary: 'Update stock levels',
        value: {
          currentStock: 85,
          minStockLevel: 25,
          maxStockLevel: 250,
        },
      },
      price: {
        summary: 'Update price and supplier',
        value: {
          unitPrice: 18.75,
          supplier: 'New Safety Supplies Inc.',
          supplierContact: 'orders@newsafety.com',
        },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.inventoryService.update(
        id,
        updateInventoryItemDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Inventory item updated successfully: ${result.name}`,
        'InventoryController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error updating inventory item ${id}: ${error.message}`,
        error.stack,
        'InventoryController',
      );
      throw error;
    }
  }

  @Delete(':id')
  @RequirePermissions('manage:inventory:delete')
  @ApiOperation({ summary: 'Delete an inventory item' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Inventory item not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Item has assigned workforce equipment',
  })
  @ApiParam({
    name: 'id',
    description: 'Inventory item ID',
    type: 'string',
    format: 'uuid',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      await this.inventoryService.remove(id, req.user.tenantId);

      this.logger.log(
        `Inventory item deleted successfully`,
        'InventoryController',
        id,
      );

      return { message: 'Inventory item deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting inventory item ${id}: ${error.message}`,
        error.stack,
        'InventoryController',
      );
      throw error;
    }
  }
}
