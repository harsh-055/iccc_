import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUUID,
  Length,
  Matches
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ 
    example: 'John', 
    description: 'User first name' 
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ 
    example: 'Doe', 
    description: 'User last name' 
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ 
    example: 'john.doe@example.com', 
    description: 'User email address' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: '+1234567890', 
    description: 'Contact phone number',
    required: false 
  })
  @IsString()
  @IsOptional()
  contactNumber?: string;

  @ApiProperty({ 
    description: 'User role ID to assign to this user',
    example: 'role-uuid'
  })
  @IsUUID('4')
  @IsNotEmpty()
  userRole: string;

  @ApiProperty({ 
    description: 'Parent user ID (for hierarchical user structure)',
    example: 'parent-user-uuid',
    required: false
  })
  @IsUUID('4')
  @IsOptional()
  parent?: string;

  @ApiProperty({ 
    description: 'User password - minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, one number, and one special character', 
    minLength: 8
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 100)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  password: string;
}