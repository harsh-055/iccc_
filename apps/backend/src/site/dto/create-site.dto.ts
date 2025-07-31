import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUrl, IsUUID } from 'class-validator';

export class CreateSiteDto {
  @ApiProperty({
    description: 'The name of the site',
    example: 'Main Website'
  })
  @IsNotEmpty({ message: 'Site name is required' })
  @IsString({ message: 'Site name must be a string' })
  name: string;

  @ApiProperty({
    description: 'The description of the site',
    example: 'Main company website',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Site description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'The URL of the site',
    example: 'https://example.com',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'Site URL must be a valid URL' })
  url?: string;

  @ApiProperty({
    description: 'The tenant ID this site belongs to',
    example: 'uuid1'
  })
  @IsNotEmpty({ message: 'Tenant ID is required' })
  @IsUUID('4', { message: 'Tenant ID must be a valid UUID' })
  tenantId: string;
} 