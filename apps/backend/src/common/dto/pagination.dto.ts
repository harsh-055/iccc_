import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({
    description: 'Number of items to skip',
    required: false,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiProperty({
    description: 'Number of items to take',
    required: false,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 10;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items for the current page',
    isArray: true,
  })
  items: T[];

  @ApiProperty({
    description: 'Total number of items',
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  pageCount: number;

  @ApiProperty({
    description: 'Whether there are more pages available',
    example: true,
  })
  hasMore: boolean;
} 