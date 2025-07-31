import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsBoolean } from 'class-validator';

export class UpdateSiteDto {
  @ApiProperty({
    description: 'The name of the site',
    example: 'Main Website',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Site name must be a string' })
  name?: string;

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
    description: 'Whether the site is active',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
} 