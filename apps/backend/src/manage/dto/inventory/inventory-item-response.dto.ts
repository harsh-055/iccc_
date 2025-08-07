import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemResponseDto {
  @ApiProperty({
    description: 'Item ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Item name',
    example: 'Safety Gloves',
  })
  name: string;

  @ApiProperty({
    description: 'Item description',
    example: 'High-quality safety gloves for waste collection',
  })
  description: string | null;

  @ApiProperty({
    description: 'Item category',
    example: 'Safety Equipment',
  })
  category: string;

  @ApiProperty({
    description: 'Item SKU (Stock Keeping Unit)',
    example: 'SG-001',
  })
  sku: string;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'pieces',
  })
  unit: string;

  @ApiProperty({
    description: 'Current stock quantity',
    example: 100,
  })
  currentStock: number;

  @ApiProperty({
    description: 'Minimum stock level for reorder',
    example: 20,
  })
  minStockLevel: number;

  @ApiProperty({
    description: 'Maximum stock level',
    example: 200,
  })
  maxStockLevel: number;

  @ApiProperty({
    description: 'Unit price',
    example: 15.5,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'Supplier name',
    example: 'Safety Supplies Co.',
  })
  supplier: string;

  @ApiProperty({
    description: 'Supplier contact information',
    example: 'contact@safetysupplies.com',
  })
  supplierContact: string | null;

  @ApiProperty({
    description: 'Item location/storage area',
    example: 'Warehouse A, Shelf 3',
  })
  location: string | null;

  @ApiProperty({
    description: 'Whether the item is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Item image URL',
    example: 'https://example.com/safety-gloves.jpg',
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Assigned site ID for site-specific inventory',
    example: 'uuid-string',
  })
  assignedSiteId: string | null;

  @ApiProperty({
    description: 'Assigned site name',
    example: 'Central Waste Collection Site',
  })
  assignedSiteName: string | null;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'uuid-string',
  })
  tenantId: string | null;

  @ApiProperty({
    description: 'Created by user ID',
    example: 'uuid-string',
  })
  createdBy: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Total value of current stock',
    example: 1550.0,
  })
  totalValue?: number;

  @ApiProperty({
    description: 'Stock status (In Stock, Low Stock, Out of Stock)',
    example: 'In Stock',
  })
  stockStatus?: string;

  @ApiProperty({
    description: 'Days until stock runs out (if applicable)',
    example: 30,
  })
  daysUntilStockout?: number;
}
