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
export enum MessageType {
  TEXT = 'Text',
  IMAGE = 'Image',
  VIDEO = 'Video'
}

export enum BroadcastStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  SCHEDULED = 'Scheduled',
  DRAFT = 'Draft'
}

export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  KANNADA = 'Kannada'
}

// DTOs and Interfaces
export interface CreateBroadcastDto {
  message_type: MessageType;
  message_content?: string;
  media_url?: string;
  language: Language;
  zone_id: string;
  ward_id: string;
  vmd_screen: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  tenant_id?: string;
}

export interface UpdateBroadcastDto {
  message_content?: string;
  media_url?: string;
  status?: BroadcastStatus;
  end_date?: string;
  end_time?: string;
  vmd_screen?: string;
}

export interface FilterBroadcastsDto {
  skip?: number;
  take?: number;
  status?: BroadcastStatus;
  message_type?: MessageType;
  zone_id?: string;
  ward_id?: string;
  language?: Language;
  vmd_screen?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'updated_at' | 'start_date' | 'end_date';
  sort_order?: 'ASC' | 'DESC';
  query?: string;
}

export interface BulkStatusUpdateDto {
  broadcast_ids: string[];
  status: BroadcastStatus;
}

export interface BulkDeleteDto {
  broadcast_ids: string[];
}

export interface BroadcastResponseDto {
  id: string;
  message_type: MessageType;
  message_content?: string;
  media_url?: string;
  language: Language;
  zone_id: string;
  ward_id: string;
  vmd_screen: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  status: BroadcastStatus;
  is_active: boolean;
  tenant_id: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  zone_name: string;
  ward_name: string;
  created_by_name: string;
  updated_by_name: string;
  tenant_name: string;
}

export interface ZoneResponseDto {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface WardResponseDto {
  id: string;
  name: string;
  zone_id: string;
  zone_name: string;
  description?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface BroadcastsListResponseDto {
  data: BroadcastResponseDto[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ZonesListResponseDto {
  data: ZoneResponseDto[];
  total: number;
}

export interface WardsListResponseDto {
  data: WardResponseDto[];
  total: number;
}

export interface BroadcastDetailResponseDto {
  broadcast: BroadcastResponseDto;
  zone?: ZoneResponseDto;
  ward?: WardResponseDto;
}

export interface BulkOperationResponseDto {
  success: number;
  failed: number;
  total: number;
  updated_broadcasts?: BroadcastResponseDto[];
  errors?: string[];
  message: string;
}

export interface BroadcastDashboardStatsDto {
  total_broadcasts: number;
  active_broadcasts: number;
  expired_broadcasts: number;
  scheduled_broadcasts: number;
  draft_broadcasts: number;
  broadcasts_by_type: {
    text: number;
    image: number;
    video: number;
  };
  broadcasts_by_zone: Array<{
    zone_name: string;
    count: number;
  }>;
}

export interface MediaUploadResponseDto {
  success: boolean;
  message: string;
  media_url: string;
  media_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface BroadcastsData {
  broadcasts: BroadcastResponseDto[];
  zones: ZoneResponseDto[];
  wards: WardResponseDto[];
}

@ApiTags('broadcasts')
@Controller('broadcasts')
export class BroadcastsController {
  
  // Path to store the JSON file
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'broadcasts-data.json');

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
      this.saveToFile(this.getDefaultBroadcastsData());
    }
  }

  // Load broadcasts data from JSON file
  private loadFromFile(): BroadcastsData {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf8');
        return JSON.parse(data);
      }
      return this.getDefaultBroadcastsData();
    } catch (error) {
      console.error('Error loading broadcasts data from file:', error);
      return this.getDefaultBroadcastsData();
    }
  }

  // Save broadcasts data to JSON file
  private saveToFile(broadcastsData: BroadcastsData): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(broadcastsData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving broadcasts data to file:', error);
      throw new HttpException('Failed to save broadcasts data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get default broadcasts data
  private getDefaultBroadcastsData(): BroadcastsData {
    // Generate UUIDs for zones
    const northZoneId = "f5795b9a-5ce1-491c-9eca-da6f5a2bc194";
    const southZoneId = "137fe13f-3857-4d07-ad70-b94e70d96c59";
    const eastZoneId = "441d7aba-43df-4002-9fc9-86811466a18b";
    const westZoneId = "26a9d004-7c00-4e20-8e41-5f5b371d90ec";
    const centralZoneId = this.generateUUID();

    // Generate UUIDs for wards
    const ward1Id = "40aeda0f-c83a-4f0a-a756-2812793bc1bb";
    const ward2Id = "41b2c4ab-cd9b-49f7-9723-de7357b87065";
    const ward3Id = "a8991d78-3cb3-4794-95cb-035472187cb5";
    const ward4Id = "feac80e0-ed1c-4820-9b31-3e7d06e1f362";
    const ward5Id = "fcb49d6d-b4ef-4ec4-911e-26e0ef03aa53";
    const ward6Id = this.generateUUID();
    const ward7Id = this.generateUUID();
    const ward8Id = this.generateUUID();

    return {
      broadcasts: [
        // EXPIRED BROADCASTS
        {
          id: "50465d0f-81f0-4807-a24b-cc7de605f4a4",
          message_type: MessageType.TEXT,
          message_content: "Accident ahead, slow down. EMERGENCY: Gas leak reported in Sector 12. Evacuation in progress. Stay away from the area until further notice.",
          media_url: null,
          language: Language.ENGLISH,
          zone_id: southZoneId,
          ward_id: ward3Id,
          vmd_screen: "Screen 5",
          start_date: "21/08/2025",
          start_time: "11:00",
          end_date: "21/08/2025",
          end_time: "23:59",
          status: BroadcastStatus.EXPIRED,
          is_active: true,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_by: "3fb3ff8f-df92-47e5-9509-70a2926c1a2f",
          updated_by: "3fb3ff8f-df92-47e5-9509-70a2926c1a2f",
          created_at: "2025-08-20T10:46:19.556Z",
          updated_at: "2025-08-21T18:29:00.099Z",
          zone_name: "South Zone",
          ward_name: "Ward 3",
          created_by_name: "John Smith",
          updated_by_name: "John Smith",
          tenant_name: "lens"
        },
        {
          id: "0009c524-e3a3-4169-8507-b6a7c1812bf1",
          message_type: MessageType.TEXT,
          message_content: "Accident ahead, slow down. WEATHER ALERT: Heavy rainfall expected tonight. Residents advised to take necessary precautions.",
          media_url: null,
          language: Language.ENGLISH,
          zone_id: eastZoneId,
          ward_id: ward4Id,
          vmd_screen: "Screen 3",
          start_date: "21/08/2025",
          start_time: "18:00",
          end_date: "22/08/2025",
          end_time: "06:00",
          status: BroadcastStatus.EXPIRED,
          is_active: true,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_by: "4ab3ff8f-df92-47e5-9509-70a2926c1a2g",
          updated_by: "4ab3ff8f-df92-47e5-9509-70a2926c1a2g",
          created_at: "2025-08-20T10:45:45.743Z",
          updated_at: "2025-08-22T00:30:00.120Z",
          zone_name: "East Zone",
          ward_name: "Ward 4",
          created_by_name: "Sarah Johnson",
          updated_by_name: "Sarah Johnson",
          tenant_name: "lens"
        },
        {
          id: "e1a53f27-e4f9-4e7c-97b0-0ed57a0b58b8",
          message_type: MessageType.TEXT,
          message_content: "Accident ahead, slow down. Community Health Camp: Free medical checkups available at City Park from 10 AM to 4 PM.",
          media_url: null,
          language: Language.ENGLISH,
          zone_id: northZoneId,
          ward_id: ward2Id,
          vmd_screen: "Screen 2",
          start_date: "22/08/2025",
          start_time: "08:00",
          end_date: "22/08/2025",
          end_time: "17:00",
          status: BroadcastStatus.EXPIRED,
          is_active: true,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_by: "5bc3ff8f-df92-47e5-9509-70a2926c1a2h",
          updated_by: "5bc3ff8f-df92-47e5-9509-70a2926c1a2h",
          created_at: "2025-08-20T10:45:33.244Z",
          updated_at: "2025-08-22T11:30:00.070Z",
          zone_name: "North Zone",
          ward_name: "Ward 2",
          created_by_name: "Michael Chen",
          updated_by_name: "Michael Chen",
          tenant_name: "lens"
        },
        {
          id: "8b9c71e8-23cc-4beb-b044-996eb8bd8867",
          message_type: MessageType.TEXT,
          message_content: "Accident ahead, slow down. URGENT: Water supply maintenance in progress. Service will be restored by 6 PM today.",
          media_url: null,
          language: Language.ENGLISH,
          zone_id: southZoneId,
          ward_id: ward1Id,
          vmd_screen: "Screen 1",
          start_date: "21/08/2025",
          start_time: "09:00",
          end_date: "21/08/2025",
          end_time: "18:00",
          status: BroadcastStatus.EXPIRED,
          is_active: true,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_by: "3fb3ff8f-df92-47e5-9509-70a2926c1a2f",
          updated_by: "3fb3ff8f-df92-47e5-9509-70a2926c1a2f",
          created_at: "2025-08-20T10:45:20.289Z",
          updated_at: "2025-08-21T12:30:00.168Z",
          zone_name: "South Zone",
          ward_name: "Ward 1",
          created_by_name: "John Smith",
          updated_by_name: "John Smith",
          tenant_name: "lens"
        },
        // ACTIVE BROADCASTS
        {
          id: "291a99a0-19ab-44c6-9189-a20cc7d596c0",
          message_type: MessageType.TEXT,
          message_content: "Accident ahead, slow down. Road Construction Notice: Main Street will be closed for repair work from 23rd to 25th August.",
          media_url: null,
          language: Language.ENGLISH,
          zone_id: westZoneId,
          ward_id: ward5Id,
          vmd_screen: "Screen 4",
          start_date: "23/08/2025",
          start_time: "07:00",
          end_date: "25/08/2025",
          end_time: "19:00",
          status: BroadcastStatus.ACTIVE,
          is_active: true,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_by: "6cd3ff8f-df92-47e5-9509-70a2926c1a2i",
          updated_by: "6cd3ff8f-df92-47e5-9509-70a2926c1a2i",
          created_at: "2025-08-20T10:46:04.394Z",
          updated_at: "2025-08-23T01:45:06.951Z",
          zone_name: "West Zone",
          ward_name: "Ward 5",
          created_by_name: "Emily Davis",
          updated_by_name: "Emily Davis",
          tenant_name: "lens"
        },
        {
          id: this.generateUUID(),
          message_type: MessageType.IMAGE,
          message_content: null,
          media_url: "https://res.cloudinary.com/demo/image/upload/v1234567/traffic_alert.jpg",
          language: Language.ENGLISH,
          zone_id: centralZoneId,
          ward_id: ward6Id,
          vmd_screen: "Screen 6",
          start_date: "24/08/2025",
          start_time: "10:00",
          end_date: "26/08/2025",
          end_time: "18:00",
          status: BroadcastStatus.ACTIVE,
          is_active: true,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_by: "7de3ff8f-df92-47e5-9509-70a2926c1a2j",
          updated_by: "7de3ff8f-df92-47e5-9509-70a2926c1a2j",
          created_at: "2025-08-23T10:00:00.000Z",
          updated_at: "2025-08-23T10:00:00.000Z",
          zone_name: "Central Zone",
          ward_name: "Ward 6",
          created_by_name: "Robert Wilson",
          updated_by_name: "Robert Wilson",
          tenant_name: "lens"
        },
        // SCHEDULED BROADCASTS
        {
          id: this.generateUUID(),
          message_type: MessageType.TEXT,
          message_content: "Independence Day Celebration: Join us at Central Park for flag hoisting ceremony at 8 AM on 26th August.",
          media_url: null,
          language: Language.ENGLISH,
          zone_id: centralZoneId,
          ward_id: ward7Id,
          vmd_screen: "Screen 7",
          start_date: "26/08/2025",
          start_time: "06:00",
          end_date: "26/08/2025",
          end_time: "20:00",
          status: BroadcastStatus.SCHEDULED,
          is_active: true,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_by: "8ef3ff8f-df92-47e5-9509-70a2926c1a2k",
          updated_by: "8ef3ff8f-df92-47e5-9509-70a2926c1a2k",
          created_at: "2025-08-24T08:00:00.000Z",
          updated_at: "2025-08-24T08:00:00.000Z",
          zone_name: "Central Zone",
          ward_name: "Ward 7",
          created_by_name: "Priya Sharma",
          updated_by_name: "Priya Sharma",
          tenant_name: "lens"
        },
        {
          id: this.generateUUID(),
          message_type: MessageType.VIDEO,
          message_content: null,
          media_url: "https://res.cloudinary.com/demo/video/upload/v1234567/safety_guidelines.mp4",
          language: Language.HINDI,
          zone_id: northZoneId,
          ward_id: ward8Id,
          vmd_screen: "Screen 8",
          start_date: "27/08/2025",
          start_time: "09:00",
          end_date: "30/08/2025",
          end_time: "21:00",
          status: BroadcastStatus.SCHEDULED,
          is_active: true,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_by: "9fg3ff8f-df92-47e5-9509-70a2926c1a2l",
          updated_by: "9fg3ff8f-df92-47e5-9509-70a2926c1a2l",
          created_at: "2025-08-24T09:00:00.000Z",
          updated_at: "2025-08-24T09:00:00.000Z",
          zone_name: "North Zone",
          ward_name: "Ward 8",
          created_by_name: "David Martinez",
          updated_by_name: "David Martinez",
          tenant_name: "lens"
        },
        // DRAFT BROADCASTS
        {
          id: this.generateUUID(),
          message_type: MessageType.TEXT,
          message_content: "Draft: Traffic diversion notice for upcoming marathon event.",
          media_url: null,
          language: Language.ENGLISH,
          zone_id: eastZoneId,
          ward_id: ward4Id,
          vmd_screen: "Screen 9",
          start_date: "28/08/2025",
          start_time: "05:00",
          end_date: "28/08/2025",
          end_time: "12:00",
          status: BroadcastStatus.DRAFT,
          is_active: true,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_by: "4ab3ff8f-df92-47e5-9509-70a2926c1a2g",
          updated_by: "4ab3ff8f-df92-47e5-9509-70a2926c1a2g",
          created_at: "2025-08-24T10:00:00.000Z",
          updated_at: "2025-08-24T10:00:00.000Z",
          zone_name: "East Zone",
          ward_name: "Ward 4",
          created_by_name: "Sarah Johnson",
          updated_by_name: "Sarah Johnson",
          tenant_name: "lens"
        },
        {
          id: this.generateUUID(),
          message_type: MessageType.IMAGE,
          message_content: null,
          media_url: "https://res.cloudinary.com/demo/image/upload/v1234567/event_poster.jpg",
          language: Language.KANNADA,
          zone_id: westZoneId,
          ward_id: ward5Id,
          vmd_screen: "Screen 10",
          start_date: "29/08/2025",
          start_time: "10:00",
          end_date: "29/08/2025",
          end_time: "18:00",
          status: BroadcastStatus.DRAFT,
          is_active: true,
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_by: "0gh3ff8f-df92-47e5-9509-70a2926c1a2m",
          updated_by: "0gh3ff8f-df92-47e5-9509-70a2926c1a2m",
          created_at: "2025-08-24T11:00:00.000Z",
          updated_at: "2025-08-24T11:00:00.000Z",
          zone_name: "West Zone",
          ward_name: "Ward 5",
          created_by_name: "Jessica Brown",
          updated_by_name: "Jessica Brown",
          tenant_name: "lens"
        }
      ],
      zones: [
        {
          id: northZoneId,
          name: "North Zone",
          description: "Northern districts of the city",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: southZoneId,
          name: "South Zone",
          description: "Southern districts of the city",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: eastZoneId,
          name: "East Zone",
          description: "Eastern districts of the city",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: westZoneId,
          name: "West Zone",
          description: "Western districts of the city",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: centralZoneId,
          name: "Central Zone",
          description: "Central business district",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        }
      ],
      wards: [
        {
          id: ward1Id,
          name: "Ward 1",
          zone_id: southZoneId,
          zone_name: "South Zone",
          description: "Ward 1 in South Zone",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: ward2Id,
          name: "Ward 2",
          zone_id: northZoneId,
          zone_name: "North Zone",
          description: "Ward 2 in North Zone",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: ward3Id,
          name: "Ward 3",
          zone_id: southZoneId,
          zone_name: "South Zone",
          description: "Ward 3 in South Zone",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: ward4Id,
          name: "Ward 4",
          zone_id: eastZoneId,
          zone_name: "East Zone",
          description: "Ward 4 in East Zone",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: ward5Id,
          name: "Ward 5",
          zone_id: westZoneId,
          zone_name: "West Zone",
          description: "Ward 5 in West Zone",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: ward6Id,
          name: "Ward 6",
          zone_id: centralZoneId,
          zone_name: "Central Zone",
          description: "Ward 6 in Central Zone",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: ward7Id,
          name: "Ward 7",
          zone_id: centralZoneId,
          zone_name: "Central Zone",
          description: "Ward 7 in Central Zone",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        },
        {
          id: ward8Id,
          name: "Ward 8",
          zone_id: northZoneId,
          zone_name: "North Zone",
          description: "Ward 8 in North Zone",
          tenant_id: "95493432-91e3-4ba1-a978-e47950991995",
          created_at: "2025-08-01T00:00:00.000Z",
          updated_at: "2025-08-01T00:00:00.000Z"
        }
      ]
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
  private async findAllInternal(filters: FilterBroadcastsDto): Promise<BroadcastsListResponseDto> {
    const data = this.loadFromFile();
    let broadcasts = [...data.broadcasts];

    // Apply filters
    broadcasts = broadcasts.filter(b => b.is_active);

    if (filters.status) {
      broadcasts = broadcasts.filter(b => b.status === filters.status);
    }

    if (filters.message_type) {
      broadcasts = broadcasts.filter(b => b.message_type === filters.message_type);
    }

    if (filters.zone_id) {
      broadcasts = broadcasts.filter(b => b.zone_id === filters.zone_id);
    }

    if (filters.ward_id) {
      broadcasts = broadcasts.filter(b => b.ward_id === filters.ward_id);
    }

    if (filters.language) {
      broadcasts = broadcasts.filter(b => b.language === filters.language);
    }

    if (filters.vmd_screen) {
      broadcasts = broadcasts.filter(b => b.vmd_screen === filters.vmd_screen);
    }

    if (filters.query) {
      const searchTerm = filters.query.toLowerCase();
      broadcasts = broadcasts.filter(b => 
        (b.message_content && b.message_content.toLowerCase().includes(searchTerm)) ||
        b.zone_name.toLowerCase().includes(searchTerm) ||
        b.ward_name.toLowerCase().includes(searchTerm) ||
        b.vmd_screen.toLowerCase().includes(searchTerm)
      );
    }

    // Sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'DESC';
    
    broadcasts.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
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
    const total = broadcasts.length;
    const skip = filters.skip || 0;
    const take = Math.min(filters.take || 10, 100);
    const paginatedBroadcasts = broadcasts.slice(skip, skip + take);

    return {
      data: paginatedBroadcasts,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      total_pages: Math.ceil(total / take)
    };
  }

  // ===== DASHBOARD STATISTICS =====

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get broadcast dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getDashboardStats(): Promise<BroadcastDashboardStatsDto> {
    try {
      const data = this.loadFromFile();
      const activeBroadcasts = data.broadcasts.filter(b => b.is_active);
      
      const stats: BroadcastDashboardStatsDto = {
        total_broadcasts: activeBroadcasts.length,
        active_broadcasts: activeBroadcasts.filter(b => b.status === BroadcastStatus.ACTIVE).length,
        expired_broadcasts: activeBroadcasts.filter(b => b.status === BroadcastStatus.EXPIRED).length,
        scheduled_broadcasts: activeBroadcasts.filter(b => b.status === BroadcastStatus.SCHEDULED).length,
        draft_broadcasts: activeBroadcasts.filter(b => b.status === BroadcastStatus.DRAFT).length,
        broadcasts_by_type: {
          text: activeBroadcasts.filter(b => b.message_type === MessageType.TEXT).length,
          image: activeBroadcasts.filter(b => b.message_type === MessageType.IMAGE).length,
          video: activeBroadcasts.filter(b => b.message_type === MessageType.VIDEO).length
        },
        broadcasts_by_zone: data.zones.map(zone => ({
          zone_name: zone.name,
          count: activeBroadcasts.filter(b => b.zone_id === zone.id).length
        }))
      };

      return stats;
    } catch (error) {
      throw new HttpException('Failed to retrieve dashboard statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }





  // ===== MAIN CRUD ENDPOINTS =====

  @Get()
  @ApiOperation({ summary: 'Get all broadcasts with pagination and filtering, or get specific broadcast by ID' })
  @ApiQuery({ name: 'id', required: false, type: String, description: 'Specific broadcast ID to retrieve' })
  @ApiQuery({ name: 'message_type', required: false, enum: MessageType, description: 'Filter by message type' })
  @ApiResponse({ status: 200, description: 'Broadcasts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Broadcast not found' })
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('id') id?: string, @Query('message_type') messageType?: MessageType): Promise<BroadcastsListResponseDto | BroadcastDetailResponseDto> {
    try {
      // If ID is provided, return specific broadcast
      if (id) {
        if (!this.isValidUUID(id)) {
          throw new BadRequestException('Invalid Broadcast ID format');
        }

        const data = this.loadFromFile();
        const broadcast = data.broadcasts.find(b => b.id === id && b.is_active);
        
        if (!broadcast) {
          throw new NotFoundException(`Broadcast with ID "${id}" not found`);
        }

        const zone = data.zones.find(z => z.id === broadcast.zone_id);
        const ward = data.wards.find(w => w.id === broadcast.ward_id);

        return {
          broadcast,
          zone,
          ward
        };
      }

      // Otherwise, return all broadcasts with message_type filtering only
      const data = this.loadFromFile();
      let broadcasts = [...data.broadcasts];

      // Apply filters
      broadcasts = broadcasts.filter(b => b.is_active);

      if (messageType) {
        broadcasts = broadcasts.filter(b => b.message_type === messageType);
      }

      // Sort by created_at DESC (most recent first)
      broadcasts.sort((a, b) => {
        const aValue = new Date(a.created_at).getTime();
        const bValue = new Date(b.created_at).getTime();
        return bValue - aValue;
      });

      return {
        data: broadcasts,
        total: broadcasts.length,
        page: 1,
        limit: broadcasts.length,
        total_pages: 1
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new HttpException('Failed to retrieve broadcasts', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  @Post()
  @ApiOperation({ summary: 'Create a new broadcast' })
  @ApiBody({
    description: 'Broadcast creation data',
    schema: {
      type: 'object',
      properties: {
        message_type: { type: 'string', enum: ['Text', 'Image', 'Video'], example: 'Text' },
        message_content: { type: 'string', example: 'Emergency alert message' },
        media_url: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
        language: { type: 'string', enum: ['English', 'Hindi', 'Kannada'], example: 'English' },
        zone_id: { type: 'string', example: 'uuid-zone-id' },
        ward_id: { type: 'string', example: 'uuid-ward-id' },
        vmd_screen: { type: 'string', example: 'Screen 1' },
        start_date: { type: 'string', example: '25/08/2025' },
        start_time: { type: 'string', example: '10:00' },
        end_date: { type: 'string', example: '26/08/2025' },
        end_time: { type: 'string', example: '18:00' }
      },
      required: ['message_type', 'language', 'zone_id', 'ward_id', 'vmd_screen', 'start_date', 'start_time']
    }
  })
  @ApiResponse({ status: 201, description: 'Broadcast created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBroadcastDto: CreateBroadcastDto): Promise<BroadcastResponseDto> {
    try {
      // Validation
      if (!Object.values(MessageType).includes(createBroadcastDto.message_type)) {
        throw new BadRequestException('Invalid message type');
      }

      if (createBroadcastDto.message_type === MessageType.TEXT) {
        if (!createBroadcastDto.message_content || createBroadcastDto.message_content.trim().length === 0) {
          throw new BadRequestException('Message content is required for Text broadcasts');
        }
      }

      if (createBroadcastDto.message_type === MessageType.IMAGE || createBroadcastDto.message_type === MessageType.VIDEO) {
        if (!createBroadcastDto.media_url || createBroadcastDto.media_url.trim().length === 0) {
          throw new BadRequestException(`Media URL is required for ${createBroadcastDto.message_type} broadcasts`);
        }
      }

      if (!Object.values(Language).includes(createBroadcastDto.language)) {
        throw new BadRequestException('Invalid language');
      }

      const data = this.loadFromFile();
      
      // Find zone and ward names
      const zone = data.zones.find(z => z.id === createBroadcastDto.zone_id);
      const ward = data.wards.find(w => w.id === createBroadcastDto.ward_id);
      
      if (!zone) {
        throw new BadRequestException('Invalid zone ID');
      }
      
      if (!ward) {
        throw new BadRequestException('Invalid ward ID');
      }

      const newBroadcast: BroadcastResponseDto = {
        id: this.generateUUID(),
        message_type: createBroadcastDto.message_type,
        message_content: createBroadcastDto.message_content || null,
        media_url: createBroadcastDto.media_url || null,
        language: createBroadcastDto.language,
        zone_id: createBroadcastDto.zone_id,
        ward_id: createBroadcastDto.ward_id,
        vmd_screen: createBroadcastDto.vmd_screen,
        start_date: createBroadcastDto.start_date,
        start_time: createBroadcastDto.start_time,
        end_date: createBroadcastDto.end_date,
        end_time: createBroadcastDto.end_time,
        status: BroadcastStatus.SCHEDULED,
        is_active: true,
        tenant_id: createBroadcastDto.tenant_id || "95493432-91e3-4ba1-a978-e47950991995",
        created_by: "3fb3ff8f-df92-47e5-9509-70a2926c1a2f",
        updated_by: "3fb3ff8f-df92-47e5-9509-70a2926c1a2f",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        zone_name: zone.name,
        ward_name: ward.name,
        created_by_name: "John Smith",
        updated_by_name: "John Smith",
        tenant_name: "lens"
      };

      data.broadcasts.unshift(newBroadcast);
      this.saveToFile(data);
      
      return newBroadcast;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new HttpException('Failed to create broadcast', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }





  // ===== MEDIA UPLOAD ENDPOINT (MOCK) =====

  @Post('upload-media')
  @ApiOperation({ summary: 'Upload media file for broadcast (mock implementation)' })
  @ApiBody({
    description: 'Media upload data',
    schema: {
      type: 'object',
      properties: {
        media_type: { type: 'string', enum: ['Image', 'Video'], example: 'Image' },
        file_name: { type: 'string', example: 'alert_image.jpg' }
      },
      required: ['media_type', 'file_name']
    }
  })
  @ApiResponse({ status: 200, description: 'Media uploaded successfully' })
  @HttpCode(HttpStatus.OK)
  async uploadMedia(@Body() mediaData: { media_type: 'Image' | 'Video'; file_name: string }): Promise<MediaUploadResponseDto> {
    try {
      // Mock implementation - returns a fake Cloudinary URL
      const mockUrl = `https://res.cloudinary.com/demo/${mediaData.media_type.toLowerCase()}/upload/v${Date.now()}/${mediaData.file_name}`;
      
      return {
        success: true,
        message: 'Media uploaded successfully',
        media_url: mockUrl,
        media_type: mediaData.media_type,
        file_size: Math.floor(Math.random() * 5000000) + 100000, // Random size between 100KB and 5MB
        uploaded_at: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException('Failed to upload media', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}