import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  HttpStatus, 
  HttpException,
  BadRequestException,
  NotFoundException,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

// Enums
export enum AlertType {
  HIGH_PRIORITY = 'High Priority',
  MEDIUM_PRIORITY = 'Medium Priority',
  LOW_PRIORITY = 'Low Priority',
  CRITICAL = 'Critical'
}

export enum AlertStatus {
  ACTIVE = 'Active',
  RESOLVED = 'Resolved',
  PENDING = 'Pending'
}

export enum VehicleStatus {
  ACTIVE = 'Active',
  IDLE = 'Idle',
  MAINTENANCE = 'Maintenance'
}

export enum BroadcastPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum BroadcastStatus {
  DELIVERED = 'Delivered',
  READ = 'Read',
  PENDING = 'Pending'
}

// Table Data Interfaces
export interface AlertTableRow {
  id: string;
  alertType: AlertType;
  location: string;
  timestamp: string;
  status: AlertStatus;
  assignedTo: string;
}

export interface VehicleTrackingTableRow {
  id: string;
  vehicleId: string;
  driverName: string;
  currentLocation: string;
  speed: number; // in km/h
  fuelLevel: number; // percentage
  status: VehicleStatus;
}

export interface BroadcastTableRow {
  id: string;
  messageTitle: string;
  recipient: string;
  sentTime: string;
  priority: BroadcastPriority;
  status: BroadcastStatus;
}

export interface ReportTables {
  alertTable: AlertTableRow[];
  vehicleTrackingTable1: VehicleTrackingTableRow[]; // Primary vehicle tracking
  vehicleTrackingTable2: VehicleTrackingTableRow[]; // Secondary vehicle tracking view
  vehicleTrackingTable3: VehicleTrackingTableRow[]; // Additional vehicle tracking dashboard
  broadcastTable: BroadcastTableRow[];
}

// DTOs and Interfaces
export interface CreateReportDto {
  reportName: string;
  description?: string;
  tenantId?: string;
}

export interface UpdateReportDto {
  reportName?: string;
  description?: string;
}

export interface ReportFilterDto {
  skip?: number;
  take?: number;
  createdByName?: string;
  id?: string; // Optional ID parameter for specific report
}

export interface Report {
  id: string;
  reportName: string;
  description?: string;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  tenantId?: string;
  tenantName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tables?: ReportTables; // Tables included in report
}

export interface ReportWithTables extends Report {
  tables: ReportTables;
}

export interface ReportsData {
  reports: Report[];
  reportTables: { [reportId: string]: ReportTables };
}

export interface PaginatedReportResponseDto {
  data: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  
  // Path to store the JSON file
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'reports-data.json');

  constructor() {
    // Ensure data directory exists
    this.ensureDataDirectory();
    // Initialize with default data if file doesn't exist
    this.initializeData();
  }

  // Ensure the data directory exists
  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.dataFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  // Initialize with default data if file doesn't exist
  private initializeData(): void {
    if (!fs.existsSync(this.dataFilePath)) {
      this.saveToFile(this.getDefaultReportsData());
    }
  }

  // Load reports data from JSON file
  private loadFromFile(): ReportsData {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf8');
        return JSON.parse(data);
      }
      return this.getDefaultReportsData();
    } catch (error) {
      console.error('Error loading reports from file:', error);
      return this.getDefaultReportsData();
    }
  }

  // Save reports data to JSON file
  private saveToFile(data: ReportsData): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving reports to file:', error);
      throw new HttpException('Failed to save reports data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Generate mock table data for a report
  private generateMockTables(): ReportTables {
    const now = new Date();
    
    // Alert Table Data
    const alertTable: AlertTableRow[] = [
      {
        id: this.generateUUID(),
        alertType: AlertType.HIGH_PRIORITY,
        location: 'Zone A',
        timestamp: new Date(now.getTime() - 1000 * 60 * 10).toISOString(), // 10 mins ago
        status: AlertStatus.ACTIVE,
        assignedTo: 'John Doe'
      },
      {
        id: this.generateUUID(),
        alertType: AlertType.MEDIUM_PRIORITY,
        location: 'Zone B',
        timestamp: new Date(now.getTime() - 1000 * 60 * 15).toISOString(), // 15 mins ago
        status: AlertStatus.RESOLVED,
        assignedTo: 'Jane Smith'
      },
      {
        id: this.generateUUID(),
        alertType: AlertType.LOW_PRIORITY,
        location: 'Zone C',
        timestamp: new Date(now.getTime() - 1000 * 60 * 45).toISOString(), // 45 mins ago
        status: AlertStatus.PENDING,
        assignedTo: 'Mike Johnson'
      },
      {
        id: this.generateUUID(),
        alertType: AlertType.CRITICAL,
        location: 'Zone D',
        timestamp: new Date(now.getTime() - 1000 * 60 * 75).toISOString(), // 75 mins ago
        status: AlertStatus.ACTIVE,
        assignedTo: 'Sarah Wilson'
      }
    ];

    // Vehicle Tracking Table 1 Data (Primary)
    const vehicleTrackingTable1: VehicleTrackingTableRow[] = [
      {
        id: this.generateUUID(),
        vehicleId: 'VH001',
        driverName: 'Robert Wilson',
        currentLocation: 'Main Street',
        speed: 45,
        fuelLevel: 85,
        status: VehicleStatus.ACTIVE
      },
      {
        id: this.generateUUID(),
        vehicleId: 'VH002',
        driverName: 'Sarah Davis',
        currentLocation: 'Park Avenue',
        speed: 32,
        fuelLevel: 62,
        status: VehicleStatus.ACTIVE
      },
      {
        id: this.generateUUID(),
        vehicleId: 'VH003',
        driverName: 'Tom Brown',
        currentLocation: 'Highway 101',
        speed: 78,
        fuelLevel: 40,
        status: VehicleStatus.ACTIVE
      },
      {
        id: this.generateUUID(),
        vehicleId: 'VH004',
        driverName: 'Emma Johnson',
        currentLocation: 'Oak Avenue',
        speed: 28,
        fuelLevel: 72,
        status: VehicleStatus.IDLE
      }
    ];

    // Vehicle Tracking Table 2 Data (Secondary view)
    const vehicleTrackingTable2: VehicleTrackingTableRow[] = [
      {
        id: this.generateUUID(),
        vehicleId: 'VH005',
        driverName: 'Michael Chen',
        currentLocation: 'Industrial Zone',
        speed: 55,
        fuelLevel: 90,
        status: VehicleStatus.ACTIVE
      },
      {
        id: this.generateUUID(),
        vehicleId: 'VH006',
        driverName: 'Lisa Anderson',
        currentLocation: 'Downtown',
        speed: 25,
        fuelLevel: 45,
        status: VehicleStatus.ACTIVE
      },
      {
        id: this.generateUUID(),
        vehicleId: 'VH007',
        driverName: 'David Martinez',
        currentLocation: 'Airport Road',
        speed: 65,
        fuelLevel: 78,
        status: VehicleStatus.ACTIVE
      },
      {
        id: this.generateUUID(),
        vehicleId: 'VH008',
        driverName: 'Jennifer Lee',
        currentLocation: 'Service Station',
        speed: 0,
        fuelLevel: 15,
        status: VehicleStatus.MAINTENANCE
      }
    ];

    // Vehicle Tracking Table 3 Data (Additional dashboard)
    const vehicleTrackingTable3: VehicleTrackingTableRow[] = [
      {
        id: this.generateUUID(),
        vehicleId: 'VH009',
        driverName: 'James Rodriguez',
        currentLocation: 'Sector 5',
        speed: 48,
        fuelLevel: 55,
        status: VehicleStatus.ACTIVE
      },
      {
        id: this.generateUUID(),
        vehicleId: 'VH010',
        driverName: 'Maria Garcia',
        currentLocation: 'Ring Road',
        speed: 72,
        fuelLevel: 68,
        status: VehicleStatus.ACTIVE
      },
      {
        id: this.generateUUID(),
        vehicleId: 'VH011',
        driverName: 'William Taylor',
        currentLocation: 'Market Area',
        speed: 18,
        fuelLevel: 82,
        status: VehicleStatus.IDLE
      },
      {
        id: this.generateUUID(),
        vehicleId: 'VH012',
        driverName: 'Sophie Turner',
        currentLocation: 'Tech Park',
        speed: 38,
        fuelLevel: 50,
        status: VehicleStatus.ACTIVE
      }
    ];

    // Broadcast Table Data
    const broadcastTable: BroadcastTableRow[] = [
      {
        id: this.generateUUID(),
        messageTitle: 'System Maintenance',
        recipient: 'All Users',
        sentTime: new Date(now.getTime() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
        priority: BroadcastPriority.HIGH,
        status: BroadcastStatus.DELIVERED
      },
      {
        id: this.generateUUID(),
        messageTitle: 'Route Update',
        recipient: 'Drivers',
        sentTime: new Date(now.getTime() - 1000 * 60 * 90).toISOString(), // 90 mins ago
        priority: BroadcastPriority.MEDIUM,
        status: BroadcastStatus.DELIVERED
      },
      {
        id: this.generateUUID(),
        messageTitle: 'Weather Alert',
        recipient: 'All Users',
        sentTime: new Date(now.getTime() - 1000 * 60 * 135).toISOString(), // 135 mins ago
        priority: BroadcastPriority.HIGH,
        status: BroadcastStatus.READ
      },
      {
        id: this.generateUUID(),
        messageTitle: 'Traffic Update',
        recipient: 'Drivers',
        sentTime: new Date(now.getTime() - 1000 * 60 * 200).toISOString(), // 200 mins ago
        priority: BroadcastPriority.LOW,
        status: BroadcastStatus.DELIVERED
      }
    ];

    return {
      alertTable,
      vehicleTrackingTable1,
      vehicleTrackingTable2,
      vehicleTrackingTable3,
      broadcastTable
    };
  }

  // Get default reports data with tables
  private getDefaultReportsData(): ReportsData {
    const reports: Report[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        reportName: 'Monthly Security Analytics Report',
        description: 'Comprehensive monthly analysis of security incidents, visitor patterns, and system performance metrics across all monitored locations',
        createdBy: 'user001',
        createdByName: 'Shuchi Sirpal',
        createdByEmail: 'shuchi.sirpal@smartcity.gov.in',
        tenantId: 'tenant001',
        tenantName: 'Smart City Office',
        isActive: true,
        createdAt: '2025-03-24T12:00:00.000Z',
        updatedAt: '2025-03-24T12:00:00.000Z',
        tables: this.generateMockTables()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        reportName: 'Weekly Visitor Management Summary',
        description: 'Weekly summary of visitor activities, entry patterns, peak hours analysis, and access control effectiveness for facility management',
        createdBy: 'user002',
        createdByName: 'Rajesh Kumar',
        createdByEmail: 'rajesh.kumar@smartcity.gov.in',
        tenantId: 'tenant001',
        tenantName: 'Smart City Office',
        isActive: true,
        createdAt: '2025-03-24T11:30:00.000Z',
        updatedAt: '2025-03-24T11:30:00.000Z',
        tables: this.generateMockTables()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        reportName: 'Incident Response Performance Report',
        description: 'Analysis of SOS incident response times, resolution effectiveness, and team performance metrics for operational improvement',
        createdBy: 'user003',
        createdByName: 'Priya Sharma',
        createdByEmail: 'priya.sharma@smartcity.gov.in',
        tenantId: 'tenant002',
        tenantName: 'Metro Security Division',
        isActive: true,
        createdAt: '2025-03-24T10:15:00.000Z',
        updatedAt: '2025-03-24T10:15:00.000Z',
        tables: this.generateMockTables()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        reportName: 'Camera System Health Report',
        description: 'Technical report on camera system uptime, performance issues, maintenance requirements, and surveillance coverage analysis',
        createdBy: 'user004',
        createdByName: 'Amit Singh',
        createdByEmail: 'amit.singh@smartcity.gov.in',
        tenantId: 'tenant001',
        tenantName: 'Smart City Office',
        isActive: true,
        createdAt: '2025-03-24T09:45:00.000Z',
        updatedAt: '2025-03-24T09:45:00.000Z',
        tables: this.generateMockTables()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        reportName: 'Quarterly Safety Compliance Report',
        description: 'Quarterly assessment of safety compliance, regulatory adherence, emergency response protocols, and risk management effectiveness',
        createdBy: 'user005',
        createdByName: 'Sunita Gupta',
        createdByEmail: 'sunita.gupta@smartcity.gov.in',
        tenantId: 'tenant003',
        tenantName: 'Public Safety Department',
        isActive: true,
        createdAt: '2025-03-23T16:20:00.000Z',
        updatedAt: '2025-03-23T16:20:00.000Z',
        tables: this.generateMockTables()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        reportName: 'Daily Operations Dashboard Report',
        description: 'Daily operational metrics including visitor flow, security alerts, system status, and staff deployment efficiency across all facilities',
        createdBy: 'user001',
        createdByName: 'Shuchi Sirpal',
        createdByEmail: 'shuchi.sirpal@smartcity.gov.in',
        tenantId: 'tenant001',
        tenantName: 'Smart City Office',
        isActive: true,
        createdAt: '2025-03-23T14:30:00.000Z',
        updatedAt: '2025-03-23T14:30:00.000Z',
        tables: this.generateMockTables()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        reportName: 'Access Control Audit Report',
        description: 'Comprehensive audit of access control systems, unauthorized entry attempts, credential management, and security protocol effectiveness',
        createdBy: 'user006',
        createdByName: 'Vikram Patel',
        createdByEmail: 'vikram.patel@smartcity.gov.in',
        tenantId: 'tenant002',
        tenantName: 'Metro Security Division',
        isActive: true,
        createdAt: '2025-03-23T13:15:00.000Z',
        updatedAt: '2025-03-23T13:15:00.000Z',
        tables: this.generateMockTables()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440008',
        reportName: 'Emergency Response Drill Report',
        description: 'Evaluation of emergency response procedures, evacuation protocols, and crisis management effectiveness during scheduled safety drills',
        createdBy: 'user007',
        createdByName: 'Neha Agarwal',
        createdByEmail: 'neha.agarwal@smartcity.gov.in',
        tenantId: 'tenant003',
        tenantName: 'Public Safety Department',
        isActive: true,
        createdAt: '2025-03-23T11:45:00.000Z',
        updatedAt: '2025-03-23T11:45:00.000Z',
        tables: this.generateMockTables()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440009',
        reportName: 'Facial Recognition Accuracy Report',
        description: 'Technical analysis of facial recognition system accuracy, false positive rates, and identification performance across different lighting conditions',
        createdBy: 'user008',
        createdByName: 'Rohit Verma',
        createdByEmail: 'rohit.verma@smartcity.gov.in',
        tenantId: 'tenant001',
        tenantName: 'Smart City Office',
        isActive: true,
        createdAt: '2025-03-22T15:20:00.000Z',
        updatedAt: '2025-03-22T15:20:00.000Z',
        tables: this.generateMockTables()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        reportName: 'Traffic Flow Analysis Report',
        description: 'Analysis of pedestrian and vehicle traffic patterns, congestion points, and flow optimization recommendations for public areas',
        createdBy: 'user009',
        createdByName: 'Kavita Joshi',
        createdByEmail: 'kavita.joshi@smartcity.gov.in',
        tenantId: 'tenant004',
        tenantName: 'Traffic Management Authority',
        isActive: true,
        createdAt: '2025-03-22T12:00:00.000Z',
        updatedAt: '2025-03-22T12:00:00.000Z',
        tables: this.generateMockTables()
      }
    ];

    // Generate tables for each report (keep the existing structure for compatibility)
    const reportTables: { [reportId: string]: ReportTables } = {};
    reports.forEach(report => {
      reportTables[report.id] = report.tables!; // Use tables from report object
    });

    return {
      reports,
      reportTables
    };
  }

  // Helper method to create API responses
  private createResponse<T>(success: boolean, message: string, data?: T): ApiResponse<T> {
    return {
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  // Helper method to generate UUID
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Helper method to validate UUID
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Helper method to check if string contains only numbers or special characters
  private isOnlyNumbersOrSpecialChars(str: string): boolean {
    const hasLetters = /[a-zA-Z]/.test(str);
    return !hasLetters;
  }

  // ===== REPORT CRUD ENDPOINTS =====

  @Post()
  @ApiOperation({ summary: 'Create a new report with tables' })
  @ApiResponse({ 
    status: 201, 
    description: 'Report created successfully'
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiBody({
    description: 'Report creation data',
    schema: {
      type: 'object',
      properties: {
        reportName: { type: 'string', example: 'Monthly Sales Report' },
        description: { type: 'string', example: 'This report contains monthly sales data and analytics' },
        tenantId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' }
      },
      required: ['reportName']
    }
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createReportDto: CreateReportDto): Promise<ApiResponse<ReportWithTables>> {
    try {
      // Validation
      if (!createReportDto.reportName) {
        throw new BadRequestException('Report name is required');
      }

      const trimmedReportName = createReportDto.reportName.trim();
      if (trimmedReportName.length === 0) {
        throw new BadRequestException('Report name cannot be empty or only whitespace');
      }

      if (this.isOnlyNumbersOrSpecialChars(trimmedReportName)) {
        throw new BadRequestException('Report name must contain at least some alphabetic characters');
      }

      if (createReportDto.description) {
        const trimmedDescription = createReportDto.description.trim();
        if (trimmedDescription.length === 0) {
          throw new BadRequestException('Description cannot be empty or only whitespace');
        }
        if (this.isOnlyNumbersOrSpecialChars(trimmedDescription)) {
          throw new BadRequestException('Description must contain at least some alphabetic characters');
        }
      }

      if (createReportDto.tenantId && !this.isValidUUID(createReportDto.tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      const data = this.loadFromFile();
      const reportId = this.generateUUID();

      // Generate tables for the new report
      const tables = this.generateMockTables();

      const newReport: Report = {
        id: reportId,
        reportName: trimmedReportName,
        description: createReportDto.description?.trim() || null,
        createdBy: 'user001',
        createdByName: 'Shuchi Sirpal',
        createdByEmail: 'shuchi.sirpal@smartcity.gov.in',
        tenantId: createReportDto.tenantId || 'tenant001',
        tenantName: 'Smart City Office',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tables: tables
      };
      
      data.reports.unshift(newReport);
      data.reportTables[reportId] = tables;
      
      this.saveToFile(data);

      const reportWithTables: ReportWithTables = {
        ...newReport,
        tables
      };

      return Promise.resolve(this.createResponse(true, 'Report created successfully', reportWithTables));
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to create report'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports with pagination and filtering, or get specific report by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reports retrieved successfully'
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip for pagination', example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take for pagination', example: 10 })
  @ApiQuery({ name: 'createdByName', required: false, type: String, description: 'Filter by creator name (partial match)', example: 'John Doe' })
  @ApiQuery({ name: 'id', required: false, type: String, description: 'Get specific report by ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @ApiQuery({ name: 'includeTables', required: false, type: Boolean, description: 'Include tables data in response', example: false })
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query() query: ReportFilterDto & { includeTables?: boolean }
  ): Promise<ApiResponse<PaginatedReportResponseDto | Report>> {
    try {
      const data = this.loadFromFile();
      
      // If ID is provided, return specific report
      if (query.id) {
        if (!this.isValidUUID(query.id)) {
          throw new BadRequestException('Invalid Report ID format');
        }

        const report = data.reports.find(r => r.id === query.id && r.isActive);
        
        if (!report) {
          throw new NotFoundException(`Report with ID ${query.id} not found`);
        }

        // Include or exclude tables based on query parameter
        const reportResponse = query.includeTables === false 
          ? { ...report, tables: undefined }
          : report;

        return Promise.resolve(this.createResponse(true, 'Report retrieved successfully', reportResponse));
      }

      // Otherwise, return paginated list
      let reports = data.reports.filter(report => report.isActive);
      
      // Filter by creator name if provided
      if (query.createdByName) {
        reports = reports.filter(report => 
          report.createdByName.toLowerCase().includes(query.createdByName.toLowerCase())
        );
      }

      // Sort by creation date (newest first)
      reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = reports.length;
      const skip = query.skip || 0;
      const take = query.take || 10;
      
      // Exclude tables from paginated list by default to reduce payload size
      const paginatedReports = reports.slice(skip, skip + take).map(report => ({
        ...report,
        tables: query.includeTables ? report.tables : undefined
      }));

      const result: PaginatedReportResponseDto = {
        data: paginatedReports,
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        totalPages: Math.ceil(total / take)
      };

      return Promise.resolve(this.createResponse(true, 'Reports retrieved successfully', result));
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to retrieve reports'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a report' })
  @ApiResponse({ 
    status: 200, 
    description: 'Report updated successfully'
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiParam({ name: 'id', type: 'string', description: 'Report ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({
    description: 'Report update data',
    schema: {
      type: 'object',
      properties: {
        reportName: { type: 'string', example: 'Updated Monthly Sales Report' },
        description: { type: 'string', example: 'Updated description with new quarterly data' }
      }
    }
  })
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto): Promise<ApiResponse<Report>> {
    try {
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid Report ID format');
      }

      // Validation
      if (!updateReportDto.reportName && !updateReportDto.description) {
        throw new BadRequestException('At least one field must be provided for update');
      }

      const hasValidUpdate = Object.values(updateReportDto).some(value => 
        value !== undefined && value !== null && value !== ''
      );
      
      if (!hasValidUpdate) {
        throw new BadRequestException('No valid fields provided for update');
      }

      if (updateReportDto.reportName !== undefined) {
        const trimmedReportName = updateReportDto.reportName.trim();
        if (trimmedReportName.length === 0) {
          throw new BadRequestException('Report name cannot be empty or only whitespace');
        }
        if (this.isOnlyNumbersOrSpecialChars(trimmedReportName)) {
          throw new BadRequestException('Report name must contain at least some alphabetic characters');
        }
      }

      if (updateReportDto.description !== undefined) {
        const trimmedDescription = updateReportDto.description.trim();
        if (trimmedDescription.length === 0) {
          throw new BadRequestException('Description cannot be empty or only whitespace');
        }
        if (this.isOnlyNumbersOrSpecialChars(trimmedDescription)) {
          throw new BadRequestException('Description must contain at least some alphabetic characters');
        }
      }

      const data = this.loadFromFile();
      const reportIndex = data.reports.findIndex(r => r.id === id && r.isActive);
      
      if (reportIndex === -1) {
        throw new NotFoundException(`Report with ID ${id} not found`);
      }

      // Update the report
      if (updateReportDto.reportName !== undefined) {
        data.reports[reportIndex].reportName = updateReportDto.reportName.trim();
      }
      if (updateReportDto.description !== undefined) {
        data.reports[reportIndex].description = updateReportDto.description.trim();
      }
      data.reports[reportIndex].updatedAt = new Date().toISOString();

      this.saveToFile(data);

      return Promise.resolve(this.createResponse(true, 'Report updated successfully', data.reports[reportIndex]));
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to update report'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report (soft delete)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Report deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Report deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid Report ID format' })
  @ApiParam({ name: 'id', type: 'string', description: 'Report ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      if (!id || id.trim().length === 0) {
        throw new BadRequestException('Report ID is required');
      }

      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid Report ID format');
      }

      const data = this.loadFromFile();
      const reportIndex = data.reports.findIndex(r => r.id === id && r.isActive);
      
      if (reportIndex === -1) {
        throw new NotFoundException(`Report with ID ${id} not found`);
      }

      // Soft delete
      data.reports[reportIndex].isActive = false;
      data.reports[reportIndex].updatedAt = new Date().toISOString();

      this.saveToFile(data);

      return Promise.resolve(this.createResponse(true, 'Report deleted successfully', { message: 'Report deleted successfully' }));
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to delete report'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

