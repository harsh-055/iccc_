import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkforceService } from '../services/workforce.service';
import {
  CreateWorkforceDto,
  UpdateWorkforceDto,
  WorkforceResponseDto,
  PaginationDto,
  BaseFilterDto,
  PaginatedResponseDto,
} from '../dto';
import { AuthPermissionGuard } from '../../permissions/guards/auth-permission.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permission.decorator';

@ApiTags('Manage - Workforce')
@ApiBearerAuth()
@Controller('manage/workforce')
@UseGuards(AuthPermissionGuard)
export class WorkforceController {
  constructor(private readonly workforceService: WorkforceService) {}

  @Post()
  @RequirePermissions('manage:workforce:create')
  @ApiOperation({ summary: 'Create a new workforce member' })
  @ApiResponse({
    status: 201,
    description: 'Workforce created successfully',
    type: WorkforceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() createWorkforceDto: CreateWorkforceDto,
    @Request() req: any,
  ): Promise<WorkforceResponseDto> {
    return this.workforceService.create(
      createWorkforceDto,
      req.user.id,
      req.tenant.id,
    );
  }

  @Get()
  @RequirePermissions('manage:workforce:read')
  @ApiOperation({
    summary: 'Get all workforce members with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Workforce list retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: BaseFilterDto,
    @Request() req: any,
  ): Promise<PaginatedResponseDto<WorkforceResponseDto>> {
    return this.workforceService.findAll(
      paginationDto,
      filterDto,
      req.tenant.id,
    );
  }

  @Get(':id')
  @RequirePermissions('manage:workforce:read')
  @ApiOperation({ summary: 'Get a workforce member by ID' })
  @ApiResponse({
    status: 200,
    description: 'Workforce retrieved successfully',
    type: WorkforceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Workforce not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WorkforceResponseDto> {
    return this.workforceService.findOne(id, req.tenant.id);
  }

  @Patch(':id')
  @RequirePermissions('manage:workforce:update')
  @ApiOperation({ summary: 'Update a workforce member' })
  @ApiResponse({
    status: 200,
    description: 'Workforce updated successfully',
    type: WorkforceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Workforce not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() updateWorkforceDto: UpdateWorkforceDto,
    @Request() req: any,
  ): Promise<WorkforceResponseDto> {
    return this.workforceService.update(
      id,
      updateWorkforceDto,
      req.user.id,
      req.tenant.id,
    );
  }

  @Delete(':id')
  @RequirePermissions('manage:workforce:delete')
  @ApiOperation({ summary: 'Delete a workforce member' })
  @ApiResponse({ status: 200, description: 'Workforce deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workforce not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.workforceService.remove(id, req.tenant.id);
  }
}
