import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'The name of the tenant',
    example: 'ACME Corporation',
  })
  @IsNotEmpty({ message: 'Tenant name is required' })
  @IsString({ message: 'Tenant name must be a string' })
  name: string;

  @ApiProperty({
    description: 'The description of the tenant',
    example: 'ACME Corporation tenant',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tenant description must be a string' })
  description?: string;
}
