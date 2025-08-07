import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInventoryItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Safety Gloves',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Item description',
    example: 'High-quality safety gloves for waste collection',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Item category',
    example: 'Safety Equipment',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    description: 'Item SKU (Stock Keeping Unit)',
    example: 'SG-001',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'pieces',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiProperty({
    description: 'Current stock quantity',
    example: 100,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @ApiProperty({
    description: 'Minimum stock level for reorder',
    example: 20,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockLevel?: number;

  @ApiProperty({
    description: 'Maximum stock level',
    example: 200,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxStockLevel?: number;

  @ApiProperty({
    description: 'Unit price',
    example: 15.5,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiProperty({
    description: 'Supplier name',
    example: 'Safety Supplies Co.',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplier?: string;

  @ApiProperty({
    description: 'Supplier contact information',
    example: 'contact@safetysupplies.com',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplierContact?: string;

  @ApiProperty({
    description: 'Item location/storage area',
    example: 'Warehouse A, Shelf 3',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({
    description: 'Whether the item is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Item image URL',
    example: 'https://example.com/safety-gloves.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Assigned site ID for site-specific inventory',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedSiteId?: string;
}
