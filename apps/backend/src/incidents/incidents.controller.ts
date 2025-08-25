import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  HttpException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

// Enums
export enum IncidentCategory {
  ENVIRONMENT = 'environment',
  CITY_EVENTS = 'city-events',
  CONSTRUCTION = 'construction',
  DISASTER_EMERGENCY = 'disaster-emergency',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  LEGAL = 'legal',
  PARKING = 'parking',
  STREET_LIGHTS = 'street-lights',
  SOLID_WASTE = 'solid-waste',
  WATER = 'water'
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video'
}

// DTOs and Interfaces
export interface CreateIncidentDto {
  title: string;
  media_url: string;
  media_type?: MediaType;
  is_critical?: boolean;
  location: string;
  camera: string;
  category: IncidentCategory;
  location_id?: string;
  tenant_id?: string;
  event_details?: EventDetailDto[];
  event_timeline?: EventTimelineDto[];
  location_data?: LocationDto;
}

export interface UpdateIncidentDto {
  is_confirmed?: boolean;
  is_bookmarked?: boolean;
}

export interface FilterIncidentsDto {
  skip?: number;
  take?: number;
  category?: IncidentCategory;
  is_bookmarked?: boolean;
  is_critical?: boolean;
  is_confirmed?: boolean;
  location?: string;
  camera?: string;
  tenant_id?: string;
  confirmed_by?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'datetime' | 'created_at' | 'updated_at' | 'title';
  sort_order?: 'ASC' | 'DESC';
  query?: string;
  id?: string; // **NEW: Optional ID parameter for specific incident**
}

export interface BulkBookmarkDto {
  incident_ids: string[];
  is_bookmarked: boolean;
}

export interface BulkConfirmDto {
  incident_ids: string[];
  is_confirmed: boolean;
}

export interface LocationDto {
  label: string;
  latitude: number;
  longitude: number;
  type: string;
}

export interface EventDetailDto {
  label: string;
  value: string;
  system_generated?: boolean;
}

export interface EventTimelineDto {
  time: string;
  event: string;
  system_generated?: boolean;
}

export interface IncidentResponseDto {
  id: string;
  title: string;
  media_url: string;
  media_type: MediaType;
  is_critical: boolean;
  location: string;
  camera: string;
  datetime: string;
  is_bookmarked: boolean;
  category: IncidentCategory;
  is_confirmed: boolean;
  location_id?: string;
  tenant_id?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  confirmed_by_name?: string;
  tenant_name?: string;
}

export interface LocationResponseDto {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface EventDetailResponseDto {
  id: string;
  incident_id: string;
  label: string;
  value: string;
  system_generated: boolean;
  created_at: string;
}

export interface EventTimelineResponseDto {
  id: string;
  incident_id: string;
  time: string;
  event: string;
  system_generated: boolean;
  created_at: string;
}

export interface IncidentsListResponseDto {
  data: IncidentResponseDto[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface IncidentDetailResponseDto {
  incident: IncidentResponseDto;
  event_details: EventDetailResponseDto[];
  event_timeline: EventTimelineResponseDto[];
  location?: LocationResponseDto;
}

export interface BulkOperationResponseDto {
  success: number;
  failed: number;
  total: number;
  updated_incidents?: IncidentResponseDto[];
  errors?: string[];
  message: string;
}

export interface IncidentsData {
  incidents: IncidentResponseDto[];
  locations: LocationResponseDto[];
  eventDetails: EventDetailResponseDto[];
  eventTimeline: EventTimelineResponseDto[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
  
  // Path to store the JSON file
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'incidents-data.json');

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
      this.saveToFile(this.getDefaultIncidentsData());
    }
  }

  // Load incidents data from JSON file
  private loadFromFile(): IncidentsData {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf8');
        return JSON.parse(data);
      }
      return this.getDefaultIncidentsData();
    } catch (error) {
      console.error('Error loading incidents data from file:', error);
      return this.getDefaultIncidentsData();
    }
  }

  // Save incidents data to JSON file
  private saveToFile(incidentsData: IncidentsData): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(incidentsData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving incidents data to file:', error);
      throw new HttpException('Failed to save incidents data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get default incidents data - USING YOUR EXACT DATA STRUCTURE
  private getDefaultIncidentsData(): IncidentsData {
    const incident1Id = "12f2aecb-11ae-4db0-be24-919d860fbfce";
    const incident2Id = "d08cd7a0-34c1-45ff-918b-9b85bcfa57a4";
    const incident3Id = "a1bf351a-194b-484e-9f02-c48886694909";
    const incident4Id = "fb04456b-03ff-4bc9-8d33-c4d3825f78d3";
    const incident5Id = "a7b96e95-f09a-4d7d-a549-cb2dd5325739";
    const incident6Id = "a5212ebc-a1f5-48a8-96f2-c0adc4e1b65a";
    const incident7Id = this.generateUUID();
    const incident8Id = this.generateUUID();
    const incident9Id = this.generateUUID();
    const incident10Id = this.generateUUID();
    const incident11Id = this.generateUUID();
    
    const location1Id = this.generateUUID();
    const location2Id = this.generateUUID();

    return {
      incidents: [
        {
          id: incident1Id,
          title: "Water Leak Detected",
          media_url: "https://vms.example.com/images/street_022.mp4",
          media_type: MediaType.VIDEO,
          is_critical: true,
          location: "Subway Station, Level 2",
          camera: "Camera 88",
          datetime: "2025-08-21T05:35:45.584Z",
          is_bookmarked: true,
          category: IncidentCategory.WATER,
          is_confirmed: true,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: "3fb3ff8f-df92-47e5-9509-70a2926c1a2f",
          confirmed_at: "2025-08-21T05:52:06.925Z",
          is_active: true,
          created_at: "2025-08-21T05:35:45.584Z",
          updated_at: "2025-08-21T05:52:52.518Z",
          confirmed_by_name: "dhruv Doe",
          tenant_name: "lens"
        },
        {
          id: incident2Id,
          title: "Garbage Overflow",
          media_url: "https://vms.example.com/images/street_019.mp4",
          media_type: MediaType.VIDEO,
          is_critical: true,
          location: "Recycling Center",
          camera: "Camera 22",
          datetime: "2025-08-21T05:35:03.262Z",
          is_bookmarked: true,
          category: IncidentCategory.SOLID_WASTE,
          is_confirmed: true,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: "3fb3ff8f-df92-47e5-9509-70a2926c1a2f",
          confirmed_at: "2025-08-21T05:52:06.925Z",
          is_active: true,
          created_at: "2025-08-21T05:35:03.262Z",
          updated_at: "2025-08-21T05:52:52.518Z",
          confirmed_by_name: "dhruv Doe",
          tenant_name: "lens"
        },
        {
          id: incident3Id,
          title: "Street Light Outage",
          media_url: "https://vms.example.com/images/street_015.mp4",
          media_type: MediaType.VIDEO,
          is_critical: true,
          location: "Main Street, Downtown",
          camera: "Camera 19",
          datetime: "2025-08-21T05:32:03.622Z",
          is_bookmarked: true,
          category: IncidentCategory.STREET_LIGHTS,
          is_confirmed: true,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: "3fb3ff8f-df92-47e5-9509-70a2926c1a2f",
          confirmed_at: "2025-08-21T05:52:06.925Z",
          is_active: true,
          created_at: "2025-08-21T05:32:03.622Z",
          updated_at: "2025-08-21T05:52:52.518Z",
          confirmed_by_name: "dhruv Doe",
          tenant_name: "lens"
        },
        {
          id: incident4Id,
          title: "Parking Violation",
          media_url: "https://vms.example.com/images/parking_011.jpg",
          media_type: MediaType.IMAGE,
          is_critical: true,
          location: "Shopping Mall Parking",
          camera: "Camera 15",
          datetime: "2025-08-21T05:30:35.539Z",
          is_bookmarked: false,
          category: IncidentCategory.PARKING,
          is_confirmed: false,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: null,
          confirmed_at: null,
          is_active: true,
          created_at: "2025-08-21T05:30:35.539Z",
          updated_at: "2025-08-21T05:30:35.539Z",
          confirmed_by_name: " ",
          tenant_name: "lens"
        },
        {
          id: incident5Id,
          title: "High Court",
          media_url: "https://vms.example.com/images/img_011.jpg",
          media_type: MediaType.IMAGE,
          is_critical: true,
          location: "High Court Delhi",
          camera: "Camera 9",
          datetime: "2025-08-21T05:25:53.137Z",
          is_bookmarked: false,
          category: IncidentCategory.LEGAL,
          is_confirmed: false,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: null,
          confirmed_at: null,
          is_active: true,
          created_at: "2025-08-21T05:25:53.137Z",
          updated_at: "2025-08-21T05:25:53.137Z",
          confirmed_by_name: " ",
          tenant_name: "lens"
        },
        {
          id: incident6Id,
          title: "Ambulance Request",
          media_url: "https://vms.example.com/images/img_010.jpg",
          media_type: MediaType.IMAGE,
          is_critical: true,
          location: "City Hospital Emergency",
          camera: "Camera 9",
          datetime: "2025-08-21T05:23:24.848Z",
          is_bookmarked: true,
          category: IncidentCategory.HEALTHCARE,
          is_confirmed: true,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: "3fb3ff8f-df92-47e5-9509-70a2926c1a2f",
          confirmed_at: "2025-08-21T05:52:06.925Z",
          is_active: true,
          created_at: "2025-08-21T05:23:24.848Z",
          updated_at: "2025-08-21T05:52:52.518Z",
          confirmed_by_name: "dhruv Doe",
          tenant_name: "lens"
        },
        {
          id: incident7Id,
          title: "School Bus Delay",
          media_url: "https://vms.example.com/images/img_007.jpg",
          media_type: MediaType.IMAGE,
          is_critical: true,
          location: "Education District",
          camera: "Camera 6",
          datetime: "2025-08-21T05:21:55.796Z",
          is_bookmarked: false,
          category: IncidentCategory.EDUCATION,
          is_confirmed: false,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: null,
          confirmed_at: null,
          is_active: true,
          created_at: "2025-08-21T05:21:55.796Z",
          updated_at: "2025-08-21T05:21:55.796Z",
          confirmed_by_name: " ",
          tenant_name: "lens"
        },
        {
          id: incident8Id,
          title: "Fire Detected",
          media_url: "https://vms.example.com/images/img_004.mp4",
          media_type: MediaType.VIDEO,
          is_critical: true,
          location: "Parking Lot, Majestic Metro Station",
          camera: "Camera 4",
          datetime: "2025-08-21T05:17:55.560Z",
          is_bookmarked: false,
          category: IncidentCategory.DISASTER_EMERGENCY,
          is_confirmed: false,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: null,
          confirmed_at: null,
          is_active: true,
          created_at: "2025-08-21T05:17:55.560Z",
          updated_at: "2025-08-21T05:17:55.560Z",
          confirmed_by_name: " ",
          tenant_name: "lens"
        },
        {
          id: incident9Id,
          title: "Construction Debris",
          media_url: "https://vms.example.com/images/img_003.jpg",
          media_type: MediaType.IMAGE,
          is_critical: true,
          location: "Building Site, Tech Park",
          camera: "Camera 3",
          datetime: "2025-08-21T05:14:55.694Z",
          is_bookmarked: false,
          category: IncidentCategory.CONSTRUCTION,
          is_confirmed: false,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: null,
          confirmed_at: null,
          is_active: true,
          created_at: "2025-08-21T05:14:55.694Z",
          updated_at: "2025-08-21T05:14:55.694Z",
          confirmed_by_name: " ",
          tenant_name: "lens"
        },
        {
          id: incident10Id,
          title: "Crowd Gathering",
          media_url: "https://vms.example.com/images/crowd_002.jpg",
          media_type: MediaType.IMAGE,
          is_critical: true,
          location: "Central Market Square",
          camera: "Camera 1",
          datetime: "2025-08-21T05:13:48.016Z",
          is_bookmarked: false,
          category: IncidentCategory.CITY_EVENTS,
          is_confirmed: false,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: null,
          confirmed_at: null,
          is_active: true,
          created_at: "2025-08-21T05:13:48.016Z",
          updated_at: "2025-08-21T05:13:48.016Z",
          confirmed_by_name: " ",
          tenant_name: "lens"
        },
        {
          id: incident11Id,
          title: "Air Quality Alert",
          media_url: "https://vms.example.com/images/air_quality.jpg",
          media_type: MediaType.IMAGE,
          is_critical: false,
          location: "Industrial Area, Sector 25",
          camera: "Camera AQ-001",
          datetime: "2025-08-24T08:00:00.000Z",
          is_bookmarked: false,
          category: IncidentCategory.ENVIRONMENT,
          is_confirmed: false,
          location_id: null,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          confirmed_by: null,
          confirmed_at: null,
          is_active: true,
          created_at: "2025-08-24T08:00:00.000Z",
          updated_at: "2025-08-24T08:00:00.000Z",
          confirmed_by_name: " ",
          tenant_name: "lens"
        }
      ],
      locations: [
        {
          id: location1Id,
          label: 'Subway Station Level 2',
          latitude: 28.4595,
          longitude: 77.0266,
          type: 'transport_hub',
          created_at: '2025-08-21T05:35:45.584Z',
          updated_at: '2025-08-21T05:35:45.584Z'
        },
        {
          id: location2Id,
          label: 'Recycling Center',
          latitude: 28.4612,
          longitude: 77.0289,
          type: 'waste_facility',
          created_at: '2025-08-21T05:35:03.262Z',
          updated_at: '2025-08-21T05:35:03.262Z'
        }
      ],
      eventDetails: [
        {
          id: this.generateUUID(),
          incident_id: incident1Id,
          label: 'Leak Size',
          value: 'Major leak affecting multiple areas',
          system_generated: true,
          created_at: '2025-08-21T05:35:45.584Z'
        },
        {
          id: this.generateUUID(),
          incident_id: incident2Id,
          label: 'Waste Type',
          value: 'Mixed Municipal Waste',
          system_generated: true,
          created_at: '2025-08-21T05:35:03.262Z'
        },
        {
          id: this.generateUUID(),
          incident_id: incident2Id,
          label: 'Estimated Volume',
          value: '500 Liters',
          system_generated: true,
          created_at: '2025-08-21T05:35:03.262Z'
        }
      ],
      eventTimeline: [
        {
          id: this.generateUUID(),
          incident_id: incident1Id,
          time: '05:35 AM',
          event: 'Water leak detected by sensors',
          system_generated: true,
          created_at: '2025-08-21T05:35:45.584Z'
        },
        {
          id: this.generateUUID(),
          incident_id: incident1Id,
          time: '05:52 AM',
          event: 'Incident Confirmed by Operator',
          system_generated: false,
          created_at: '2025-08-21T05:52:06.925Z'
        },
        {
          id: this.generateUUID(),
          incident_id: incident2Id,
          time: '05:35 AM',
          event: 'Waste overflow detected by AI',
          system_generated: true,
          created_at: '2025-08-21T05:35:03.262Z'
        },
        {
          id: this.generateUUID(),
          incident_id: incident2Id,
          time: '05:52 AM',
          event: 'Incident Confirmed by Operator',
          system_generated: false,
          created_at: '2025-08-21T05:52:06.925Z'
        }
      ]
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

  // Internal method to handle filtering and pagination
  private async findAllInternal(filters: FilterIncidentsDto): Promise<IncidentsListResponseDto | IncidentDetailResponseDto> {
    const data = this.loadFromFile();

    // **NEW: If ID is provided, return specific incident with details**
    if (filters.id) {
      if (!this.isValidUUID(filters.id)) {
        throw new BadRequestException('Invalid Incident ID format');
      }

      const incident = data.incidents.find(i => i.id === filters.id && i.is_active);
      
      if (!incident) {
        throw new NotFoundException(`Incident with ID "${filters.id}" not found`);
      }

      const eventDetails = data.eventDetails.filter(ed => ed.incident_id === filters.id);
      const eventTimeline = data.eventTimeline.filter(et => et.incident_id === filters.id);
      
      let location: LocationResponseDto | undefined;
      if (incident.location_id) {
        location = data.locations.find(l => l.id === incident.location_id);
      }

      return {
        incident,
        event_details: eventDetails,
        event_timeline: eventTimeline,
        location
      } as IncidentDetailResponseDto;
    }

    // **EXISTING: Return paginated list of incidents**
    let incidents = [...data.incidents];

    // Apply filters
    incidents = incidents.filter(i => i.is_active);

    if (filters.category) {
      incidents = incidents.filter(i => i.category === filters.category);
    }

    if (filters.is_bookmarked !== undefined) {
      incidents = incidents.filter(i => i.is_bookmarked === filters.is_bookmarked);
    }

    if (filters.is_critical !== undefined) {
      incidents = incidents.filter(i => i.is_critical === filters.is_critical);
    }

    if (filters.is_confirmed !== undefined) {
      incidents = incidents.filter(i => i.is_confirmed === filters.is_confirmed);
    }

    if (filters.location) {
      incidents = incidents.filter(i => 
        i.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.camera) {
      incidents = incidents.filter(i => 
        i.camera.toLowerCase().includes(filters.camera!.toLowerCase())
      );
    }

    if (filters.tenant_id) {
      incidents = incidents.filter(i => i.tenant_id === filters.tenant_id);
    }

    if (filters.confirmed_by) {
      incidents = incidents.filter(i => i.confirmed_by === filters.confirmed_by);
    }

    if (filters.date_from) {
      incidents = incidents.filter(i => 
        new Date(i.datetime) >= new Date(filters.date_from!)
      );
    }

    if (filters.date_to) {
      incidents = incidents.filter(i => 
        new Date(i.datetime) <= new Date(filters.date_to!)
      );
    }

    if (filters.query) {
      const searchTerm = filters.query.toLowerCase();
      incidents = incidents.filter(i => 
        i.title.toLowerCase().includes(searchTerm) ||
        i.location.toLowerCase().includes(searchTerm) ||
        i.camera.toLowerCase().includes(searchTerm) ||
        i.category.toLowerCase().includes(searchTerm)
      );
    }

    // Sorting
    const sortBy = filters.sort_by || 'datetime';
    const sortOrder = filters.sort_order || 'DESC';
    
    incidents.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'datetime' || sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const total = incidents.length;
    const skip = filters.skip || 0;
    const take = Math.min(filters.take || 10, 100);
    const paginatedIncidents = incidents.slice(skip, skip + take);

    return {
      data: paginatedIncidents,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      total_pages: Math.ceil(total / take)
    } as IncidentsListResponseDto;
  }

  // ===== BULK OPERATIONS =====

  @Post('bulk/bookmark')
  @ApiOperation({ summary: 'Bulk bookmark or unbookmark multiple incidents' })
  @ApiResponse({ status: 200, description: 'Bulk bookmark operation completed' })
  @ApiBody({
    description: 'Bulk bookmark data',
    schema: {
      type: 'object',
      properties: {
        incident_ids: { type: 'array', items: { type: 'string' } },
        is_bookmarked: { type: 'boolean' }
      },
      required: ['incident_ids', 'is_bookmarked']
    }
  })
  @HttpCode(HttpStatus.OK)
  async bulkBookmark(@Body() bulkBookmarkDto: BulkBookmarkDto): Promise<BulkOperationResponseDto> {
    try {
      if (!bulkBookmarkDto.incident_ids || !Array.isArray(bulkBookmarkDto.incident_ids)) {
        throw new BadRequestException('incident_ids must be provided as an array');
      }

      if (bulkBookmarkDto.incident_ids.length === 0) {
        throw new BadRequestException('At least one incident ID must be provided');
      }

      if (typeof bulkBookmarkDto.is_bookmarked !== 'boolean') {
        throw new BadRequestException('is_bookmarked must be a boolean value');
      }

      // Validate UUIDs
      const invalidUUIDs = [];
      for (let i = 0; i < bulkBookmarkDto.incident_ids.length; i++) {
        const incidentId = bulkBookmarkDto.incident_ids[i];
        if (!this.isValidUUID(incidentId)) {
          invalidUUIDs.push(`Index ${i}: "${incidentId}" is not a valid UUID`);
        }
      }

      if (invalidUUIDs.length > 0) {
        throw new BadRequestException(`Invalid incident IDs found: ${invalidUUIDs.join(', ')}`);
      }

      const data = this.loadFromFile();
      let success = 0;
      let failed = 0;
      const updatedIncidents: IncidentResponseDto[] = [];
      const errors: string[] = [];

      for (const incidentId of bulkBookmarkDto.incident_ids) {
        const incidentIndex = data.incidents.findIndex(i => i.id === incidentId && i.is_active);
        
        if (incidentIndex !== -1) {
          data.incidents[incidentIndex].is_bookmarked = bulkBookmarkDto.is_bookmarked;
          data.incidents[incidentIndex].updated_at = new Date().toISOString();
          updatedIncidents.push(data.incidents[incidentIndex]);
          success++;
        } else {
          errors.push(`Incident ${incidentId} not found or inactive`);
          failed++;
        }
      }

      this.saveToFile(data);

      return {
        success,
        failed,
        total: bulkBookmarkDto.incident_ids.length,
        updated_incidents: updatedIncidents,
        errors: errors.length > 0 ? errors : undefined,
        message: `${success} incidents ${bulkBookmarkDto.is_bookmarked ? 'bookmarked' : 'unbookmarked'} successfully. ${failed} failed.`
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new HttpException('Failed to perform bulk bookmark operation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('bulk/confirm')
  @ApiOperation({ summary: 'Bulk confirm or deny multiple incidents' })
  @ApiResponse({ status: 200, description: 'Bulk confirm operation completed' })
  @ApiBody({
    description: 'Bulk confirm data',
    schema: {
      type: 'object',
      properties: {
        incident_ids: { type: 'array', items: { type: 'string' } },
        is_confirmed: { type: 'boolean' }
      },
      required: ['incident_ids', 'is_confirmed']
    }
  })
  @HttpCode(HttpStatus.OK)
  async bulkConfirm(@Body() bulkConfirmDto: BulkConfirmDto): Promise<BulkOperationResponseDto> {
    try {
      if (!bulkConfirmDto.incident_ids || !Array.isArray(bulkConfirmDto.incident_ids)) {
        throw new BadRequestException('incident_ids must be provided as an array');
      }

      if (bulkConfirmDto.incident_ids.length === 0) {
        throw new BadRequestException('At least one incident ID must be provided');
      }

      if (typeof bulkConfirmDto.is_confirmed !== 'boolean') {
        throw new BadRequestException('is_confirmed must be a boolean value');
      }

      // Validate UUIDs
      const invalidUUIDs = [];
      for (let i = 0; i < bulkConfirmDto.incident_ids.length; i++) {
        const incidentId = bulkConfirmDto.incident_ids[i];
        if (!this.isValidUUID(incidentId)) {
          invalidUUIDs.push(`Index ${i}: "${incidentId}" is not a valid UUID`);
        }
      }

      if (invalidUUIDs.length > 0) {
        throw new BadRequestException(`Invalid incident IDs found: ${invalidUUIDs.join(', ')}`);
      }

      const data = this.loadFromFile();
      let success = 0;
      let failed = 0;
      const updatedIncidents: IncidentResponseDto[] = [];
      const errors: string[] = [];

      for (const incidentId of bulkConfirmDto.incident_ids) {
        const incidentIndex = data.incidents.findIndex(i => i.id === incidentId && i.is_active);
        
        if (incidentIndex !== -1) {
          data.incidents[incidentIndex].is_confirmed = bulkConfirmDto.is_confirmed;
          data.incidents[incidentIndex].confirmed_by = "3fb3ff8f-df92-47e5-9509-70a2926c1a2f";
          data.incidents[incidentIndex].confirmed_at = new Date().toISOString();
          data.incidents[incidentIndex].confirmed_by_name = "dhruv Doe";
          data.incidents[incidentIndex].updated_at = new Date().toISOString();
          
          // Add timeline entry
          const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          const timelineEvent = bulkConfirmDto.is_confirmed 
            ? 'Incident Bulk Confirmed by Operator' 
            : 'Incident Bulk Denied by Operator';

          data.eventTimeline.push({
            id: this.generateUUID(),
            incident_id: incidentId,
            time: currentTime,
            event: timelineEvent,
            system_generated: false,
            created_at: new Date().toISOString()
          });

          updatedIncidents.push(data.incidents[incidentIndex]);
          success++;
        } else {
          errors.push(`Incident ${incidentId} not found or inactive`);
          failed++;
        }
      }

      this.saveToFile(data);

      return {
        success,
        failed,
        total: bulkConfirmDto.incident_ids.length,
        updated_incidents: updatedIncidents,
        errors: errors.length > 0 ? errors : undefined,
        message: `${success} incidents ${bulkConfirmDto.is_confirmed ? 'confirmed' : 'denied'} successfully. ${failed} failed.`
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new HttpException('Failed to perform bulk confirm operation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ===== MAIN CRUD ENDPOINTS =====

  @Get()
  @ApiOperation({ summary: 'Get all incidents with optional filtering and pagination, or get specific incident by ID' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take (max 100)' })
  @ApiQuery({ name: 'category', required: false, enum: IncidentCategory, description: 'Filter by category (optional - shows all if not specified)' })
  @ApiQuery({ name: 'is_bookmarked', required: false, type: Boolean, description: 'Filter by bookmark status' })
  @ApiQuery({ name: 'is_critical', required: false, type: Boolean, description: 'Filter by critical status' })
  @ApiQuery({ name: 'is_confirmed', required: false, type: Boolean, description: 'Filter by confirmation status' })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Filter by location' })
  @ApiQuery({ name: 'camera', required: false, type: String, description: 'Filter by camera' })
  @ApiQuery({ name: 'query', required: false, type: String, description: 'Search query' })
  @ApiQuery({ name: 'sort_by', required: false, enum: ['datetime', 'created_at', 'updated_at', 'title'], description: 'Sort field' })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiQuery({ name: 'id', required: false, type: String, description: 'Get specific incident by ID (UUID)', example: '12f2aecb-11ae-4db0-be24-919d860fbfce' }) // **NEW: Optional ID parameter**
  @ApiResponse({ status: 200, description: 'Incidents retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() filters: FilterIncidentsDto): Promise<IncidentsListResponseDto | IncidentDetailResponseDto> {
    try {
      return await this.findAllInternal(filters);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new HttpException('Failed to retrieve incidents', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new incident (backend/AI use)' })
  @ApiBody({
    description: 'Incident creation data',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Fire Detected' },
        media_url: { type: 'string', example: 'https://vms.example.com/images/fire_001.jpg' },
        media_type: { type: 'string', enum: ['image', 'video'], example: 'image' },
        is_critical: { type: 'boolean', example: true },
        location: { type: 'string', example: 'Parking Lot, Majestic Metro Station' },
        camera: { type: 'string', example: 'Camera 1' },
        category: { type: 'string', example: 'disaster-emergency' },
        tenant_id: { type: 'string', example: '95493432-91e3-4ba1-a978-e47950991995' }
      },
      required: ['title', 'media_url', 'location', 'camera', 'category']
    }
  })
  @ApiResponse({ status: 201, description: 'Incident created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createIncidentDto: CreateIncidentDto): Promise<IncidentResponseDto> {
    try {
      // Validation
      if (!createIncidentDto.title || createIncidentDto.title.trim().length === 0) {
        throw new BadRequestException('Title is required');
      }

      if (!createIncidentDto.media_url || createIncidentDto.media_url.trim().length === 0) {
        throw new BadRequestException('Media URL is required');
      }

      if (!createIncidentDto.location || createIncidentDto.location.trim().length === 0) {
        throw new BadRequestException('Location is required');
      }

      if (!createIncidentDto.camera || createIncidentDto.camera.trim().length === 0) {
        throw new BadRequestException('Camera is required');
      }

      if (!Object.values(IncidentCategory).includes(createIncidentDto.category)) {
        throw new BadRequestException('Invalid category');
      }

      const data = this.loadFromFile();
      
      const newIncident: IncidentResponseDto = {
        id: this.generateUUID(),
        title: createIncidentDto.title.trim(),
        media_url: createIncidentDto.media_url.trim(),
        media_type: createIncidentDto.media_type || MediaType.IMAGE,
        is_critical: createIncidentDto.is_critical || false,
        location: createIncidentDto.location.trim(),
        camera: createIncidentDto.camera.trim(),
        datetime: new Date().toISOString(),
        is_bookmarked: false,
        category: createIncidentDto.category,
        is_confirmed: false,
        location_id: createIncidentDto.location_id || null,
        tenant_id: createIncidentDto.tenant_id || "95493432-91e3-4ba1-a978-e47950991995",
        confirmed_by: null,
        confirmed_at: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confirmed_by_name: " ",
        tenant_name: "lens"
      };

      data.incidents.unshift(newIncident);

      // Add initial timeline entry
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      data.eventTimeline.push({
        id: this.generateUUID(),
        incident_id: newIncident.id,
        time: currentTime,
        event: `${createIncidentDto.category} incident detected`,
        system_generated: true,
        created_at: new Date().toISOString()
      });

      this.saveToFile(data);
      return newIncident;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new HttpException('Failed to create incident', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

//   @Delete(':id')
//   @ApiOperation({ summary: 'Delete incident (soft delete)' })
//   @ApiParam({ name: 'id', type: 'string', description: 'Incident ID (UUID)' })
//   @ApiResponse({ status: 200, description: 'Incident deleted successfully' })
//   @ApiResponse({ status: 404, description: 'Incident not found' })
//   @ApiResponse({ status: 400, description: 'Invalid Incident ID format' })
//   @HttpCode(HttpStatus.OK)
//   async remove(@Param('id') id: string): Promise<{ message: string }> {
//     try {
//       if (!this.isValidUUID(id)) {
//         throw new BadRequestException('Invalid Incident ID format');
//       }

//       const data = this.loadFromFile();
//       const incidentIndex = data.incidents.findIndex(i => i.id === id && i.is_active);
      
//       if (incidentIndex === -1) {
//         throw new NotFoundException(`Incident with ID "${id}" not found`);
//       }

//       const incidentTitle = data.incidents[incidentIndex].title;
      
//       // Soft delete
//       data.incidents[incidentIndex].is_active = false;
//       data.incidents[incidentIndex].updated_at = new Date().toISOString();

//       this.saveToFile(data);

//       return { message: `Incident "${incidentTitle}" deleted successfully` };
//     } catch (error) {
//       if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
//       throw new HttpException('Failed to delete incident', HttpStatus.INTERNAL_SERVER_ERROR);
//     }
//   }
}


