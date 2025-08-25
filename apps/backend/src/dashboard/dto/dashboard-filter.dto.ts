import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class DashboardFilterDto {
  @ApiProperty({ 
    description: 'Zone filter - if provided, returns data for specific zone only', 
    example: 'Zone 1',
    required: false,
    enum: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5']
  })
  @IsOptional()
  @IsString()
  @IsIn(['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'])
  zone?: string;
} 