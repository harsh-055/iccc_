import { Controller, Get, Post, Body, UseGuards, Request, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Public } from '../permissions/decorators/public.decorators';
import { TenantGuard } from './guards/tenant.guard';
import { ApiProperty } from '@nestjs/swagger';
import { RequirePermissions } from '../permissions/decorators/require-permission.decorator';

class TenantResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  
  @ApiProperty({ example: 'ACME Corporation' })
  name: string;
  
  @ApiProperty({ 
    example: 'Global company specializing in widgets',
    required: false 
  })
  description?: string;
  
  @ApiProperty({ example: true })
  isActive: boolean;
  
  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  createdAt: string;
  
  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  updatedAt: string;
}

@ApiTags('Tenant')
@Controller('tenants')
@ApiBearerAuth('Bearer')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Public()
  @ApiOperation({ 
    summary: 'Create a new tenant/organization',
    description: 'Creates a new tenant/organization in the system. This endpoint is public and can be used by anyone to create a new organization.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The tenant has been successfully created.',
    type: TenantResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A tenant with this name already exists.'
  })
  create(@Body() createTenantDto: CreateTenantDto, @Request() req) {
    const adminId = req.user?.id || null;
    return this.tenantService.createTenant(adminId, createTenantDto);
  }

  @Get()
  @UseGuards(TenantGuard)
  @RequirePermissions('READ_TENANT')
  @ApiBearerAuth('Bearer')
  @ApiOperation({ 
    summary: 'Get all tenants',
    description: 'Retrieves a paginated list of all tenants. Requires authentication.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all tenants.',
    type: [TenantResponseDto]
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.'
  })
  findAll(@Request() req) {
    const adminId = req.user.id;
    return this.tenantService.getTenants(adminId);
  }

  @Get('with-users')
  @UseGuards(TenantGuard)
  @RequirePermissions('READ_TENANT')
  @ApiBearerAuth('Bearer')
  @ApiOperation({ 
    summary: 'Get all tenants with associated users',
    description: 'Retrieves a simplified list of all tenants with their associated user information. Returns tenant ID, name, and associated users.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all tenants with associated users.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tenantId: { 
            type: 'string', 
            example: '550e8400-e29b-41d4-a716-446655440000',
            description: 'Tenant ID' 
          },
          tenantName: { 
            type: 'string', 
            example: 'ACME Corporation',
            description: 'Tenant name' 
          },
          users: {
            type: 'array',
            description: 'Associated users',
            items: {
              type: 'object',
              properties: {
                id: { 
                  type: 'string', 
                  example: '660e8400-e29b-41d4-a716-446655440001',
                  description: 'User ID' 
                },
                name: { 
                  type: 'string', 
                  example: 'John Doe',
                  description: 'User name' 
                },
                email: { 
                  type: 'string', 
                  example: 'john.doe@acme.com',
                  description: 'User email' 
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions - READ_TENANT permission required.'
  })
  getAllTenantsWithUsers(@Request() req) {
    const adminId = req.user.id;
    return this.tenantService.getAllTenantsWithUsers(adminId);
  }

  @Get(':id/details')
  @UseGuards(TenantGuard)
  @RequirePermissions('READ_TENANT')
  @ApiBearerAuth('Bearer')
  @ApiOperation({ 
    summary: 'Get tenant details with associated users',
    description: 'Retrieves detailed information about a specific tenant including name, ID, and all associated user IDs. Requires authentication and READ_TENANT permission.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant details with associated users retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          example: '550e8400-e29b-41d4-a716-446655440000',
          description: 'Unique tenant identifier' 
        },
        name: { 
          type: 'string', 
          example: 'ACME Corporation',
          description: 'Tenant/organization name' 
        },
        description: { 
          type: 'string', 
          example: 'Global company specializing in widgets',
          description: 'Tenant description'
        },
        isActive: { 
          type: 'boolean', 
          example: true,
          description: 'Whether the tenant is active' 
        },
        createdAt: { 
          type: 'string', 
          example: '2023-01-01T00:00:00Z',
          description: 'Tenant creation timestamp' 
        },
        updatedAt: { 
          type: 'string', 
          example: '2023-01-01T00:00:00Z',
          description: 'Last update timestamp' 
        },
        users: {
          type: 'array',
          description: 'List of users associated with this tenant',
          items: {
            type: 'object',
            properties: {
              id: { 
                type: 'string', 
                example: '660e8400-e29b-41d4-a716-446655440001',
                description: 'User ID' 
              },
              name: { 
                type: 'string', 
                example: 'John Doe',
                description: 'User full name' 
              },
              email: { 
                type: 'string', 
                example: 'john.doe@acme.com',
                description: 'User email address' 
              }
            }
          }
        },
        userCount: {
          type: 'number',
          example: 15,
          description: 'Total number of users in this tenant'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Tenant with ID 550e8400-e29b-41d4-a716-446655440000 not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions - READ_TENANT permission required.'
  })
  getTenantDetails(@Request() req, @Param('id') tenantId: string) {
    const adminId = req.user.id;
    return this.tenantService.getTenantWithUsers(adminId, tenantId);
  }

  @Post('with-admin')
  @Public()
  @ApiOperation({ 
    summary: 'Create a new tenant with admin (Recommended)',
    description: `
    🏢 **Complete Multi-Tenant Setup in One Call**
    
    This endpoint creates a complete multi-tenant organization setup including:
    • New tenant/organization
    • Admin user for that tenant
    • All tenant-specific permissions
    • 2 tenant-specific roles (Admin, User)
    • Automatic permission assignments
    
    ✅ **Perfect for onboarding new businesses/organizations**
    `
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tenant and admin created successfully with complete setup',
    schema: {
      type: 'object',
      properties: {
        tenant: {
          type: 'object',
          description: 'Created tenant information',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000', description: 'Unique tenant ID' },
            name: { type: 'string', example: 'ACME Corporation', description: 'Tenant name' },
            description: { type: 'string', example: 'Global widgets and gadgets company', description: 'Tenant description' },
            isActive: { type: 'boolean', example: true, description: 'Whether tenant is active' },
            createdAt: { type: 'string', example: '2024-01-15T10:30:00Z', description: 'Creation timestamp' },
            updatedAt: { type: 'string', example: '2024-01-15T10:30:00Z', description: 'Last update timestamp' }
          }
        },
        admin: {
          type: 'object', 
          description: 'Created admin user information',
          properties: {
            id: { type: 'string', example: '456e7890-e89b-12d3-a456-426614174111', description: 'Admin user ID' },
            name: { type: 'string', example: 'John Smith', description: 'Admin full name' },
            email: { type: 'string', example: 'admin@acme.com', description: 'Admin email (login)' },
            tenantId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000', description: 'Associated tenant ID' }
          }
        },
        setup: {
          type: 'object',
          description: 'Setup completion details',
          properties: {
            permissionsCreated: { type: 'number', example: 50, description: 'Number of tenant permissions created' },
            role: { 
              type: 'object',
              description: 'Admin role details',
              properties: {
                id: { type: 'string', example: '789e0123-e89b-12d3-a456-426614174222' },
                name: { type: 'string', example: 'Admin' },
                description: { type: 'string', example: 'Administrator for ACME Corporation' },
                tenantId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' }
              }
            },
            message: { type: 'string', example: 'Tenant created successfully with admin and full permission setup' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' }, example: ['Tenant name is required', 'Email must be valid'] },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Tenant name or email already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'A tenant with this name already exists' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @ApiBody({
    description: '🏢 Complete tenant and admin setup data',
    schema: {
      type: 'object',
      properties: {
        tenantData: {
          type: 'object',
          description: 'Organization/Tenant information',
          properties: {
            name: { 
              type: 'string', 
              description: 'Unique organization name',
              example: 'ACME Corporation',
              minLength: 2,
              maxLength: 100
            },
            description: { 
              type: 'string', 
              description: 'Organization description (optional)',
              example: 'Global widgets and gadgets company founded in 1949',
              maxLength: 500
            }
          },
          required: ['name']
        },
        adminData: {
          type: 'object',
          description: 'Admin user information',
          properties: {
            name: { 
              type: 'string', 
              description: 'Admin full name',
              example: 'John Smith',
              minLength: 2,
              maxLength: 100
            },
            email: { 
              type: 'string', 
              description: 'Admin email (must be unique globally)',
              example: 'admin@acme.com',
              format: 'email'
            },
            password: { 
              type: 'string', 
              description: 'Strong password (min 8 chars, include uppercase, lowercase, number)',
              example: 'SecurePassword123!',
              minLength: 8
            },
            phoneNumber: { 
              type: 'string', 
              description: 'Phone number with country code (optional)',
              example: '+1-555-0123',
              pattern: '^\\+[1-9]\\d{1,14}$'
            }
          },
          required: ['name', 'email', 'password']
        }
      },
      required: ['tenantData', 'adminData']
    },
    examples: {
      acmeCorp: {
        summary: '🏢 ACME Corporation Setup',
        description: 'Complete setup for a manufacturing company',
        value: {
          tenantData: {
            name: 'ACME Corporation',
            description: 'Leading manufacturer of widgets and industrial gadgets since 1949'
          },
          adminData: {
            name: 'John Smith',
            email: 'john.smith@acme.com',
            password: 'SecurePassword123!',
            phoneNumber: '+1-555-0123'
          }
        }
      },
      techStartup: {
        summary: '🚀 Tech Startup Setup',
        description: 'Setup for a technology startup',
        value: {
          tenantData: {
            name: 'InnovateTech Solutions',
            description: 'AI-powered software solutions for modern businesses'
          },
          adminData: {
            name: 'Sarah Johnson',
            email: 'sarah@innovatetech.com',
            password: 'Innovation2024!',
            phoneNumber: '+1-555-0456'
          }
        }
      },
      retailChain: {
        summary: '🛍️ Retail Chain Setup',
        description: 'Setup for a retail chain organization',
        value: {
          tenantData: {
            name: 'SuperMart Retail Chain',
            description: 'Multi-location retail chain with 50+ stores nationwide'
          },
          adminData: {
            name: 'Mike Davis',
            email: 'mike.davis@supermart.com',
            password: 'Retail2024Secure!',
            phoneNumber: '+1-555-0789'
          }
        }
      }
    }
  })
  async createTenantWithAdmin(@Body() data: any, @Request() req) {
    const adminId = req.user?.id || null;
    return this.tenantService.createTenantWithAdmin(adminId, data.tenantData, data.adminData);
  }
}