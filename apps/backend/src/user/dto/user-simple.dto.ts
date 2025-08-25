import { ApiProperty } from '@nestjs/swagger';

export class UserSimpleDto {
  @ApiProperty({ description: 'User ID', example: 'user-001' })
  user_id: string;

  @ApiProperty({ description: 'User full name', example: 'Debayan Deb' })
  user_name: string;

  @ApiProperty({ description: 'Email address', example: 'main.user@lenscorp.ai' })
  email_address: string;

  @ApiProperty({ description: 'User role', example: 'Super-Admin' })
  role: string;

  @ApiProperty({ description: 'User status', example: 'Active', enum: ['Active', 'Inactive'] })
  status: string;

  @ApiProperty({ description: 'Last seen time', example: '30 minutes ago' })
  last_seen: string;

  @ApiProperty({ description: 'First name', example: 'Debayan' })
  first_name: string;

  @ApiProperty({ description: 'Last name', example: 'Deb' })
  last_name: string;

  @ApiProperty({ description: 'Contact number', example: '+91-9876543210' })
  contact_number: string;

  @ApiProperty({ description: 'Parent user', example: 'Admin User' })
  parent: string;
}

export class UsersResponseDto {
  @ApiProperty({ description: 'List of users', type: [UserSimpleDto] })
  users: UserSimpleDto[];

  @ApiProperty({ description: 'Total number of users', example: 15 })
  total: number;

  @ApiProperty({ description: 'Number of online users', example: 0 })
  online: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 2 })
  totalPages: number;
} 