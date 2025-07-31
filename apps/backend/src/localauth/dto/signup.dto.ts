import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, Matches, IsOptional,IsBoolean,IsUUID} from 'class-validator';

export class SignupDto {

  @ApiProperty()
  @IsNotEmpty({ message: 'Full name is required' })
  name: string;
  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;


  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;


  @ApiProperty()
  @IsNotEmpty({ message: 'Confirm Password is required' })
  @MinLength(6, { message: 'Confirm Password must be at least 6 characters' })
  
  @ApiProperty()
  @IsOptional()
  confirmPassword: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty({ message: 'Username is required' })
  username?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber?: string;
  

   @ApiProperty({ 
    example: 'true', 
    description: 'Whether the user is creating a new organization/tenant', 
    required: true,
    default: true
  })
  @IsNotEmpty({ message: 'Organization creator status is required' })
  @IsBoolean()
  isOrganizationCreator: boolean = true;

  @ApiProperty({ 
    example: 'ACME Corporation', 
    description: 'Organization/tenant name (required)', 
    required: true 
  })
  @IsNotEmpty({ message: 'Organization name is required' })
  organizationName: string;

  @ApiProperty({ 
    example: 'A global company specializing in widgets', 
    description: 'Organization/tenant description', 
    required: false 
  })
  @IsOptional()
  organizationDescription?: string;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000', 
    description: 'Existing tenant ID (if joining an existing organization instead of creating one)', 
    required: false 
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid tenant ID format' })
  tenantId?: string;
}

