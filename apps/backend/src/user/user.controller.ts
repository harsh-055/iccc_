import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserSimpleDto, UsersResponseDto } from './dto/user-simple.dto';

@Controller('users')
@ApiTags('Users')
export class UserController {
  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: UsersResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Debayan' })
  @ApiQuery({ name: 'status', required: false, type: String, example: 'Active' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ): Promise<UsersResponseDto> {
    // Mock data based on the UI shown in the images
    const usersData: UserSimpleDto[] = [
      {
        user_id: 'user-001',
        user_name: 'Debayan Deb',
        email_address: 'main.user@lenscorp.ai',
        role: 'Super-Admin',
        status: 'Active',
        last_seen: '30 minutes ago',
        first_name: 'Debayan',
        last_name: 'Deb',
        contact_number: '+91-9876543210',
        parent: 'System Admin',
      },
      {
        user_id: 'user-002',
        user_name: 'Priya Sharma',
        email_address: 'priya.sharma@lenscorp.ai',
        role: 'Administrator',
        status: 'Active',
        last_seen: '2 hours ago',
        first_name: 'Priya',
        last_name: 'Sharma',
        contact_number: '+91-9876543211',
        parent: 'Debayan Deb',
      },
      {
        user_id: 'user-003',
        user_name: 'Amit Patel',
        email_address: 'amit.patel@lenscorp.ai',
        role: 'User Admin',
        status: 'Active',
        last_seen: '1 hour ago',
        first_name: 'Amit',
        last_name: 'Patel',
        contact_number: '+91-9876543212',
        parent: 'Priya Sharma',
      },
      {
        user_id: 'user-004',
        user_name: 'Sneha Reddy',
        email_address: 'sneha.reddy@lenscorp.ai',
        role: 'User Admin',
        status: 'Inactive',
        last_seen: '5 days ago',
        first_name: 'Sneha',
        last_name: 'Reddy',
        contact_number: '+91-9876543213',
        parent: 'Amit Patel',
      },
      {
        user_id: 'user-005',
        user_name: 'Vikram Singh',
        email_address: 'vikram.singh@lenscorp.ai',
        role: 'Administrator',
        status: 'Active',
        last_seen: '45 minutes ago',
        first_name: 'Vikram',
        last_name: 'Singh',
        contact_number: '+91-9876543214',
        parent: 'Debayan Deb',
      },
    ];

    // Filter by status if provided
    let filteredData = usersData;
    if (status) {
      filteredData = usersData.filter(user => user.status === status);
    }

    // Search functionality
    if (search) {
      filteredData = filteredData.filter(user =>
        user.user_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email_address.toLowerCase().includes(search.toLowerCase()) ||
        user.role.toLowerCase().includes(search.toLowerCase())
      );
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      users: paginatedData,
      total: filteredData.length,
      online: 0, // Mock data shows 0 online users
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filteredData.length / limitNum),
    };
  }
}
