import { ApiProperty } from '@nestjs/swagger';

export class InventorySimpleDto {
  @ApiProperty({
    description: 'Item ID',
    example: 'ID001',
  })
  item_id: string;

  @ApiProperty({
    description: 'Inventory item name',
    example: 'PPE Kits',
  })
  inventory_item: string;

  @ApiProperty({
    description: 'Total units available',
    example: 3000,
  })
  total_units: number;

  @ApiProperty({
    description: 'Number of assigned units',
    example: 2560,
  })
  assigned: number;

  @ApiProperty({
    description: 'Number of unassigned units',
    example: 30,
  })
  unassigned: number;

  @ApiProperty({
    description: 'Low stock alert zones',
    example: 'Zone 4, Zone 7',
  })
  low_stock_alert: string;
} 