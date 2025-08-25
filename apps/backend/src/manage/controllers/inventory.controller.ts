import {
  Controller,
  Get,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { InventorySimpleDto } from '../dto/inventory/inventory-simple.dto';

@Controller('manage/inventory')
@ApiTags('Manage - Inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all inventory items',
    description: 'Retrieves simplified inventory data matching the UI table structure'
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory items retrieved successfully',
    type: [InventorySimpleDto]
  })
  async findAll(): Promise<InventorySimpleDto[]> {
    try {
      // Static inventory data matching the UI table - simplified fields only
      const inventoryData = [
        {
          item_id: 'ID001',
          inventory_item: 'PPE Kits',
          total_units: 3000,
          assigned: 2560,
          unassigned: 440,
          low_stock_alert: 'Zone 1, Zone 7'
        },
        {
          item_id: 'ID002',
          inventory_item: 'Gloves',
          total_units: 3000,
          assigned: 2000,
          unassigned: 1000,
          low_stock_alert: 'Zone 2, Zone 7'
        },
        {
          item_id: 'ID003',
          inventory_item: 'Uniform Sets',
          total_units: 3000,
          assigned: 2200,
          unassigned: 800,
          low_stock_alert: 'Zone 3, Zone 7'
        },
        {
          item_id: 'ID004',
          inventory_item: 'Brooms',
          total_units: 3000,
          assigned: 2500,
          unassigned: 500,
          low_stock_alert: 'Zone 4, Zone 7'
        },
        {
          item_id: 'ID005',
          inventory_item: 'Tools',
          total_units: 3000,
          assigned: 2300,
          unassigned: 700,
          low_stock_alert: 'Zone 5, Zone 7'
        }
      ];

      this.logger.log(
        `Inventory items retrieved successfully: ${inventoryData.length} total items`,
        'InventoryController',
      );

      return inventoryData;
    } catch (error) {
      this.logger.error(
        `Error fetching inventory items: ${error.message}`,
        error.stack,
        'InventoryController',
      );
      throw error;
    }
  }
}
