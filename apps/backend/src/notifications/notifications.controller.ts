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
export enum NotificationGroupType {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email'
}

export enum ContactType {
  PHONE = 'phone',
  EMAIL = 'email'
}

// DTOs and Interfaces
export interface CreateNotificationGroupDto {
  name: string;
  description?: string;
  groupType: NotificationGroupType;
  tenant_id?: string;
}

export interface UpdateNotificationGroupDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface AddRecipientDto {
  user_id: string;
  contact_type: ContactType;
}

export interface AddMultipleRecipientsDto {
  user_ids: string[];
  contact_type: ContactType;
}

export interface BulkRemoveRecipientsDto {
  recipient_ids: string[];
}

export interface FilterNotificationGroupsDto {
  skip?: number;
  take?: number;
  group_type?: NotificationGroupType;
}

export interface NotificationGroupTypeDto {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationGroup {
  id: string;
  name: string;
  description?: string;
  group_type_id: string;
  tenant_id?: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  group_type?: NotificationGroupTypeDto;
  tenant_name?: string;
  created_by_name?: string;
  recipient_count?: number;
}

export interface Recipient {
  id: string;
  user_id: string;
  group_id: string;
  contact_value: string;
  contact_type: ContactType;
  is_active: boolean;
  added_at: string;
  added_by: string;
  user_name: string;
  user_email: string;
  added_by_name: string;
}

export interface AvailableContact {
  user_id: string;
  phone_number?: string;
  display_phone?: string;
  email?: string;
  user_name: string;
  already_added?: boolean;
}

export interface NotificationGroupsListResponseDto {
  data: NotificationGroup[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface NotificationGroupDetailResponseDto {
  group: NotificationGroup;
  recipients: Recipient[];
  available_contacts: {
    available_phone_contacts: AvailableContact[];
    available_email_contacts: AvailableContact[];
  };
  statistics: {
    total_recipients: number;
    active_recipients: number;
    phone_contacts: number;
    email_contacts: number;
  };
}

export interface BulkOperationResponseDto {
  success: number;
  failed: number;
  total: number;
  updated_recipients?: Recipient[];
  errors?: string[];
  message: string;
}

export interface GroupStatisticsDto {
  total_groups: number;
  whatsapp_groups: number;
  sms_groups: number;
  email_groups: number;
  total_recipients: number;
  groups_by_type: {
    group_type: string;
    count: number;
    display_name: string;
  }[];
}

export interface NotificationsData {
  groupTypes: NotificationGroupTypeDto[];
  groups: NotificationGroup[];
  recipients: Recipient[];
  availableContacts: AvailableContact[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  
  // Path to store the JSON file
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'notifications-data.json');

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
      this.saveToFile(this.getDefaultNotificationsData());
    }
  }

  // Load notifications data from JSON file
  private loadFromFile(): NotificationsData {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf8');
        return JSON.parse(data);
      }
      return this.getDefaultNotificationsData();
    } catch (error) {
      console.error('Error loading notifications data from file:', error);
      return this.getDefaultNotificationsData();
    }
  }

  // Save notifications data to JSON file
  private saveToFile(notificationsData: NotificationsData): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(notificationsData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving notifications data to file:', error);
      throw new HttpException('Failed to save notifications data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get default notifications data with proper UUIDs
  private getDefaultNotificationsData(): NotificationsData {
    // Generate consistent UUIDs for group types
    const whatsappTypeId = this.generateUUID();
    const smsTypeId = this.generateUUID();
    const emailTypeId = this.generateUUID();

    // Generate UUIDs for groups
    const emergencyContactsId = this.generateUUID();
    const supportTeamId = this.generateUUID();
    const smsAlertGroupId = this.generateUUID();
    const smsNotificationGroupId = this.generateUUID();
    const emailMarketingId = this.generateUUID();

    return {
      groupTypes: [
        {
          id: whatsappTypeId,
          name: 'whatsapp',
          display_name: 'WhatsApp',
          description: 'Send notifications to WhatsApp groups',
          is_active: true,
          created_at: '2025-03-20T10:00:00.000Z',
          updated_at: '2025-03-20T10:00:00.000Z'
        },
        {
          id: smsTypeId,
          name: 'sms',
          display_name: 'SMS',
          description: 'Send notifications via SMS',
          is_active: true,
          created_at: '2025-03-20T10:00:00.000Z',
          updated_at: '2025-03-20T10:00:00.000Z'
        },
        {
          id: emailTypeId,
          name: 'email',
          display_name: 'Email',
          description: 'Send notifications via Email',
          is_active: true,
          created_at: '2025-03-20T10:00:00.000Z',
          updated_at: '2025-03-20T10:00:00.000Z'
        }
      ],
      groups: [
        {
          id: emergencyContactsId,
          name: 'Emergency Contacts',
          description: 'Emergency contacts for critical incidents',
          group_type_id: whatsappTypeId,
          tenant_id: 'tenant001',
          created_by: 'user001',
          is_active: true,
          created_at: '2025-03-24T12:00:00.000Z',
          updated_at: '2025-03-24T12:00:00.000Z',
          group_type: {
            id: whatsappTypeId,
            name: 'whatsapp',
            display_name: 'WhatsApp',
            description: 'Send notifications to WhatsApp groups',
            is_active: true,
            created_at: '2025-03-20T10:00:00.000Z',
            updated_at: '2025-03-20T10:00:00.000Z'
          },
          tenant_name: 'Smart City Office',
          created_by_name: 'Shuchi Sirpal',
          recipient_count: 3
        },
        {
          id: supportTeamId,
          name: 'Support Team',
          description: 'Support team for incident notifications',
          group_type_id: whatsappTypeId,
          created_by: 'user002',
          tenant_id: 'tenant001',
          is_active: true,
          created_at: '2025-03-24T11:30:00.000Z',
          updated_at: '2025-03-24T11:30:00.000Z',
          group_type: {
            id: whatsappTypeId,
            name: 'whatsapp',
            display_name: 'WhatsApp',
            description: 'Send notifications to WhatsApp groups',
            is_active: true,
            created_at: '2025-03-20T10:00:00.000Z',
            updated_at: '2025-03-20T10:00:00.000Z'
          },
          tenant_name: 'Smart City Office',
          created_by_name: 'Rajesh Kumar',
          recipient_count: 3
        },
        {
          id: smsAlertGroupId,
          name: 'SMS Alert Group',
          description: 'SMS notifications for security alerts',
          group_type_id: smsTypeId,
          tenant_id: 'tenant001',
          created_by: 'user003',
          is_active: true,
          created_at: '2025-03-24T10:15:00.000Z',
          updated_at: '2025-03-24T10:15:00.000Z',
          group_type: {
            id: smsTypeId,
            name: 'sms',
            display_name: 'SMS',
            description: 'Send notifications via SMS',
            is_active: true,
            created_at: '2025-03-20T10:00:00.000Z',
            updated_at: '2025-03-20T10:00:00.000Z'
          },
          tenant_name: 'Smart City Office',
          created_by_name: 'Priya Sharma',
          recipient_count: 2
        },
        {
          id: smsNotificationGroupId,
          name: 'SMS Notification Group',
          description: 'General SMS notifications for staff',
          group_type_id: smsTypeId,
          tenant_id: 'tenant001',
          created_by: 'user004',
          is_active: true,
          created_at: '2025-03-24T09:45:00.000Z',
          updated_at: '2025-03-24T09:45:00.000Z',
          group_type: {
            id: smsTypeId,
            name: 'sms',
            display_name: 'SMS',
            description: 'Send notifications via SMS',
            is_active: true,
            created_at: '2025-03-20T10:00:00.000Z',
            updated_at: '2025-03-20T10:00:00.000Z'
          },
          tenant_name: 'Smart City Office',
          created_by_name: 'Amit Singh',
          recipient_count: 2
        },
        {
          id: emailMarketingId,
          name: 'Email Marketing',
          description: 'Email notifications for marketing and updates',
          group_type_id: emailTypeId,
          tenant_id: 'tenant001',
          created_by: 'user005',
          is_active: true,
          created_at: '2025-03-23T16:20:00.000Z',
          updated_at: '2025-03-23T16:20:00.000Z',
          group_type: {
            id: emailTypeId,
            name: 'email',
            display_name: 'Email',
            description: 'Send notifications via Email',
            is_active: true,
            created_at: '2025-03-20T10:00:00.000Z',
            updated_at: '2025-03-20T10:00:00.000Z'
          },
          tenant_name: 'Smart City Office',
          created_by_name: 'Sunita Gupta',
          recipient_count: 2
        }
      ],
      recipients: [
        // WhatsApp Emergency Contacts
        {
          id: this.generateUUID(),
          user_id: 'user101',
          group_id: emergencyContactsId,
          contact_value: '+91 9560807792',
          contact_type: ContactType.PHONE,
          is_active: true,
          added_at: '2025-03-24T12:30:00.000Z',
          added_by: 'user001',
          user_name: 'Rajesh Kumar',
          user_email: 'rajesh.kumar@smartcity.gov.in',
          added_by_name: 'Shuchi Sirpal'
        },
        {
          id: this.generateUUID(),
          user_id: 'user102',
          group_id: emergencyContactsId,
          contact_value: '+91 9876543210',
          contact_type: ContactType.PHONE,
          is_active: true,
          added_at: '2025-03-24T12:31:00.000Z',
          added_by: 'user001',
          user_name: 'Priya Sharma',
          user_email: 'priya.sharma@smartcity.gov.in',
          added_by_name: 'Shuchi Sirpal'
        },
        {
          id: this.generateUUID(),
          user_id: 'user103',
          group_id: emergencyContactsId,
          contact_value: '+91 8765432109',
          contact_type: ContactType.PHONE,
          is_active: true,
          added_at: '2025-03-24T12:32:00.000Z',
          added_by: 'user001',
          user_name: 'Amit Singh',
          user_email: 'amit.singh@smartcity.gov.in',
          added_by_name: 'Shuchi Sirpal'
        },
        // WhatsApp Support Team
        {
          id: this.generateUUID(),
          user_id: 'user104',
          group_id: supportTeamId,
          contact_value: '+91 1234567890',
          contact_type: ContactType.PHONE,
          is_active: true,
          added_at: '2025-03-24T11:45:00.000Z',
          added_by: 'user002',
          user_name: 'Vikram Patel',
          user_email: 'vikram.patel@smartcity.gov.in',
          added_by_name: 'Rajesh Kumar'
        },
        {
          id: this.generateUUID(),
          user_id: 'user105',
          group_id: supportTeamId,
          contact_value: '+91 0987654321',
          contact_type: ContactType.PHONE,
          is_active: true,
          added_at: '2025-03-24T11:46:00.000Z',
          added_by: 'user002',
          user_name: 'Neha Agarwal',
          user_email: 'neha.agarwal@smartcity.gov.in',
          added_by_name: 'Rajesh Kumar'
        },
        {
          id: this.generateUUID(),
          user_id: 'user106',
          group_id: supportTeamId,
          contact_value: '+91 1122334455',
          contact_type: ContactType.PHONE,
          is_active: true,
          added_at: '2025-03-24T11:47:00.000Z',
          added_by: 'user002',
          user_name: 'Rohit Verma',
          user_email: 'rohit.verma@smartcity.gov.in',
          added_by_name: 'Rajesh Kumar'
        },
        // SMS Groups
        {
          id: this.generateUUID(),
          user_id: 'user107',
          group_id: smsAlertGroupId,
          contact_value: '+91 9988776655',
          contact_type: ContactType.PHONE,
          is_active: true,
          added_at: '2025-03-24T10:30:00.000Z',
          added_by: 'user003',
          user_name: 'Kavita Joshi',
          user_email: 'kavita.joshi@smartcity.gov.in',
          added_by_name: 'Priya Sharma'
        },
        {
          id: this.generateUUID(),
          user_id: 'user108',
          group_id: smsAlertGroupId,
          contact_value: '+91 6677889900',
          contact_type: ContactType.PHONE,
          is_active: true,
          added_at: '2025-03-24T10:31:00.000Z',
          added_by: 'user003',
          user_name: 'Deepak Mehta',
          user_email: 'deepak.mehta@smartcity.gov.in',
          added_by_name: 'Priya Sharma'
        },
        {
          id: this.generateUUID(),
          user_id: 'user109',
          group_id: smsNotificationGroupId,
          contact_value: '+91 6677889900',
          contact_type: ContactType.PHONE,
          is_active: true,
          added_at: '2025-03-24T09:50:00.000Z',
          added_by: 'user004',
          user_name: 'Anjali Reddy',
          user_email: 'anjali.reddy@smartcity.gov.in',
          added_by_name: 'Amit Singh'
        },
        {
          id: this.generateUUID(),
          user_id: 'user110',
          group_id: smsNotificationGroupId,
          contact_value: '+91 1122334455',
          contact_type: ContactType.PHONE,
          is_active: true,
          added_at: '2025-03-24T09:51:00.000Z',
          added_by: 'user004',
          user_name: 'Manoj Yadav',
          user_email: 'manoj.yadav@smartcity.gov.in',
          added_by_name: 'Amit Singh'
        },
        // Email Groups
        {
          id: this.generateUUID(),
          user_id: 'user111',
          group_id: emailMarketingId,
          contact_value: 'john@example.com',
          contact_type: ContactType.EMAIL,
          is_active: true,
          added_at: '2025-03-23T16:30:00.000Z',
          added_by: 'user005',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          added_by_name: 'Sunita Gupta'
        },
        {
          id: this.generateUUID(),
          user_id: 'user112',
          group_id: emailMarketingId,
          contact_value: 'jane@example.com',
          contact_type: ContactType.EMAIL,
          is_active: true,
          added_at: '2025-03-23T16:31:00.000Z',
          added_by: 'user005',
          user_name: 'Jane Smith',
          user_email: 'jane@example.com',
          added_by_name: 'Sunita Gupta'
        }
      ],
      availableContacts: [
        {
          user_id: 'user201',
          phone_number: '+91 9999999999',
          display_phone: '+91 9999999999',
          email: 'contact1@example.com',
          user_name: 'Available User 1',
          already_added: false
        },
        {
          user_id: 'user202',
          phone_number: '+91 8888888888',
          display_phone: '+91 8888888888',
          email: 'contact2@example.com',
          user_name: 'Available User 2',
          already_added: false
        },
        {
          user_id: 'user203',
          phone_number: '+91 7777777777',
          display_phone: '+91 7777777777',
          email: 'contact3@example.com',
          user_name: 'Available User 3',
          already_added: false
        },
        {
          user_id: 'user204',
          phone_number: '+91 6666666666',
          display_phone: '+91 6666666666',
          email: 'admin@example.com',
          user_name: 'Admin User',
          already_added: false
        },
        {
          user_id: 'user205',
          phone_number: '+91 5555555555',
          display_phone: '+91 5555555555',
          email: 'support@example.com',
          user_name: 'Support User',
          already_added: false
        },
        {
          user_id: 'user206',
          email: 'marketing@example.com',
          user_name: 'Marketing Team',
          already_added: false
        },
        {
          user_id: 'user207',
          email: 'sales@example.com',
          user_name: 'Sales Team',
          already_added: false
        },
        {
          user_id: 'user208',
          email: 'info@example.com',
          user_name: 'Info Team',
          already_added: false
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

  // Helper method to validate UUID or custom ID format
  private isValidUUID(id: string): boolean {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return false;
    }
    
    const trimmedId = id.trim();
    
    // Accept proper UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Accept custom ID format (alphanumeric with optional underscores/hyphens)
    const customIdRegex = /^[a-zA-Z0-9_-]+$/;
    
    return uuidRegex.test(trimmedId) || customIdRegex.test(trimmedId);
  }

  // Helper method to check if string contains only numbers or special characters
  private isOnlyNumbersOrSpecialChars(str: string): boolean {
    const hasLetters = /[a-zA-Z]/.test(str);
    return !hasLetters;
  }

  // ===== STATISTICS ENDPOINT =====

  @Get('statistics')
  @ApiOperation({ summary: 'Get notification statistics for dashboard display' })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully'
  })
  @HttpCode(HttpStatus.OK)
  getStatistics(): Promise<ApiResponse<GroupStatisticsDto>> {
    try {
      const data = this.loadFromFile();
      const activeGroups = data.groups.filter(g => g.is_active);
      const activeRecipients = data.recipients.filter(r => r.is_active);

      const whatsappGroups = activeGroups.filter(g => g.group_type?.name === 'whatsapp').length;
      const smsGroups = activeGroups.filter(g => g.group_type?.name === 'sms').length;
      const emailGroups = activeGroups.filter(g => g.group_type?.name === 'email').length;

      const stats: GroupStatisticsDto = {
        total_groups: activeGroups.length,
        whatsapp_groups: whatsappGroups,
        sms_groups: smsGroups,
        email_groups: emailGroups,
        total_recipients: activeRecipients.length,
        groups_by_type: [
          { group_type: 'whatsapp', count: whatsappGroups, display_name: 'WhatsApp' },
          { group_type: 'sms', count: smsGroups, display_name: 'SMS' },
          { group_type: 'email', count: emailGroups, display_name: 'Email' }
        ]
      };

      return Promise.resolve(this.createResponse(true, 'Statistics retrieved successfully', stats));
    } catch (error) {
      throw new HttpException(
        this.createResponse(false, 'Failed to retrieve notification statistics'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== MAIN CRUD ENDPOINTS =====

  @Get('groups')
  @ApiOperation({ summary: 'Get all notification groups with filtering and pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take (max 100)' })
  @ApiQuery({ name: 'group_type', required: false, enum: NotificationGroupType, description: 'Filter by group type (whatsapp, sms, email)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Groups retrieved successfully'
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() filters: FilterNotificationGroupsDto): Promise<ApiResponse<NotificationGroupsListResponseDto>> {
    try {
      const data = this.loadFromFile();
      let groups = [...data.groups];

      // Apply filters - only active groups by default
      groups = groups.filter(g => g.is_active);

      if (filters.group_type) {
        groups = groups.filter(g => g.group_type?.name === filters.group_type);
      }

      // Sort by created_at DESC (newest first) - hardcoded
      groups.sort((a, b) => {
        const aValue = new Date(a.created_at).getTime();
        const bValue = new Date(b.created_at).getTime();
        return bValue - aValue; // DESC order
      });

      // Pagination
      const total = groups.length;
      const skip = filters.skip || 0;
      const take = Math.min(filters.take || 20, 100);
      const paginatedGroups = groups.slice(skip, skip + take);

      const result: NotificationGroupsListResponseDto = {
        data: paginatedGroups,
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        total_pages: Math.ceil(total / take)
      };

      return Promise.resolve(this.createResponse(true, 'Groups retrieved successfully', result));
    } catch (error) {
      throw new HttpException(
        this.createResponse(false, 'Failed to retrieve notification groups'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get notification group details by ID with recipients and available contacts' })
  @ApiParam({ name: 'id', type: 'string', description: 'Group ID (UUID or custom format)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Group details retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<ApiResponse<NotificationGroupDetailResponseDto>> {
    try {
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid Group ID format');
      }

      const data = this.loadFromFile();
      const group = data.groups.find(g => g.id === id && g.is_active);
      
      if (!group) {
        throw new NotFoundException(`Notification group with ID "${id}" not found`);
      }

      const recipients = data.recipients.filter(r => r.group_id === id && r.is_active);
      
      // Get available contacts based on group type
      let availablePhoneContacts = [];
      let availableEmailContacts = [];
      
      if (group.group_type?.name === 'whatsapp' || group.group_type?.name === 'sms') {
        availablePhoneContacts = data.availableContacts
          .filter(c => c.phone_number)
          .map(c => ({
            ...c,
            already_added: recipients.some(r => r.user_id === c.user_id && r.contact_type === ContactType.PHONE)
          }));
      }
      
      if (group.group_type?.name === 'email') {
        availableEmailContacts = data.availableContacts
          .filter(c => c.email)
          .map(c => ({
            ...c,
            already_added: recipients.some(r => r.user_id === c.user_id && r.contact_type === ContactType.EMAIL)
          }));
      }

      const phoneContacts = recipients.filter(r => r.contact_type === ContactType.PHONE).length;
      const emailContacts = recipients.filter(r => r.contact_type === ContactType.EMAIL).length;

      const result: NotificationGroupDetailResponseDto = {
        group,
        recipients,
        available_contacts: {
          available_phone_contacts: availablePhoneContacts,
          available_email_contacts: availableEmailContacts
        },
        statistics: {
          total_recipients: recipients.length,
          active_recipients: recipients.filter(r => r.is_active).length,
          phone_contacts: phoneContacts,
          email_contacts: emailContacts
        }
      };

      return Promise.resolve(this.createResponse(true, 'Group details retrieved successfully', result));
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to retrieve group details'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create a new notification group' })
  @ApiResponse({ 
    status: 201, 
    description: 'Group created successfully'
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - Group name already exists' })
  @ApiBody({
    description: 'Notification group creation data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Emergency Contacts' },
        description: { type: 'string', example: 'Emergency contacts for critical incidents' },
        groupType: { type: 'string', enum: ['whatsapp', 'sms', 'email'], example: 'whatsapp' },
        tenant_id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' }
      },
      required: ['name', 'groupType']
    }
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateNotificationGroupDto): Promise<ApiResponse<NotificationGroup>> {
    try {
      // Validation
      if (!createDto.name) {
        throw new BadRequestException('Group name is required');
      }

      const trimmedName = createDto.name.trim();
      if (trimmedName.length === 0) {
        throw new BadRequestException('Group name cannot be empty or only whitespace');
      }

      if (this.isOnlyNumbersOrSpecialChars(trimmedName)) {
        throw new BadRequestException('Group name must contain at least some alphabetic characters');
      }

      if (createDto.description) {
        const trimmedDescription = createDto.description.trim();
        if (trimmedDescription.length === 0) {
          throw new BadRequestException('Description cannot be empty or only whitespace');
        }
        if (this.isOnlyNumbersOrSpecialChars(trimmedDescription)) {
          throw new BadRequestException('Description must contain at least some alphabetic characters');
        }
      }

      if (!Object.values(NotificationGroupType).includes(createDto.groupType)) {
        throw new BadRequestException('Invalid group type');
      }

      const data = this.loadFromFile();
      
      // Check for duplicate group name within same type
      const duplicateGroup = data.groups.find(g => 
        g.name.toLowerCase() === trimmedName.toLowerCase() &&
        g.group_type?.name === createDto.groupType &&
        g.is_active
      );

      if (duplicateGroup) {
        throw new BadRequestException(`A group named "${trimmedName}" already exists for ${createDto.groupType} type`);
      }

      // Find group type
      const groupType = data.groupTypes.find(gt => gt.name === createDto.groupType);
      if (!groupType) {
        throw new BadRequestException(`Invalid group type: ${createDto.groupType}`);
      }

      const newGroup: NotificationGroup = {
        id: this.generateUUID(),
        name: trimmedName,
        description: createDto.description?.trim() || null,
        group_type_id: groupType.id,
        tenant_id: createDto.tenant_id || 'tenant001',
        created_by: 'user001',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        group_type: groupType,
        tenant_name: 'Smart City Office',
        created_by_name: 'Shuchi Sirpal',
        recipient_count: 0
      };

      data.groups.unshift(newGroup);
      this.saveToFile(data);

      return Promise.resolve(this.createResponse(true, 'Group created successfully', newGroup));
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to create notification group'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== RECIPIENT MANAGEMENT ENDPOINTS =====

  @Post('groups/:id/recipients')
  @ApiOperation({ summary: 'Add recipient(s) to notification group (single or multiple)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Group ID (UUID or custom format)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Recipient(s) added successfully'
  })
  @ApiResponse({ status: 404, description: 'Group or user not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data or user already exists' })
  @ApiBody({
    description: 'Add recipient data (single or multiple)',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            user_id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' },
            contact_type: { type: 'string', enum: ['phone', 'email'], example: 'phone' }
          },
          required: ['user_id', 'contact_type']
        },
        {
          type: 'object',
          properties: {
            user_ids: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']
            },
            contact_type: { type: 'string', enum: ['phone', 'email'], example: 'phone' }
          },
          required: ['user_ids', 'contact_type']
        }
      ]
    }
  })
  @HttpCode(HttpStatus.CREATED)
  addRecipients(@Param('id') id: string, @Body() addRecipientsDto: any): Promise<ApiResponse<any>> {
    try {
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid Group ID format');
      }

      const data = this.loadFromFile();
      const group = data.groups.find(g => g.id === id && g.is_active);
      
      if (!group) {
        throw new NotFoundException(`Notification group with ID "${id}" not found`);
      }

      // Check if it's single or multiple recipients
      if (addRecipientsDto.user_id) {
        // Single recipient
        return this.addSingleRecipient(id, addRecipientsDto, group, data);
      } else if (addRecipientsDto.user_ids) {
        // Multiple recipients
        return this.addMultipleRecipientsInternal(id, addRecipientsDto, group, data);
      } else {
        throw new BadRequestException('Either user_id or user_ids must be provided');
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to add recipient(s)'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('groups/:id/recipients/bulk')
  @ApiOperation({ summary: 'Remove multiple recipients from group' })
  @ApiParam({ name: 'id', type: 'string', description: 'Group ID (UUID or custom format)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk remove operation completed'
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  @ApiBody({
    description: 'Bulk remove recipients data',
    schema: {
      type: 'object',
      properties: {
        recipient_ids: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']
        }
      },
      required: ['recipient_ids']
    }
  })
  @HttpCode(HttpStatus.OK)
  removeRecipients(@Param('id') id: string, @Body() removeDto: BulkRemoveRecipientsDto): Promise<ApiResponse<BulkOperationResponseDto>> {
    try {
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid Group ID format');
      }

      // Validate all recipient IDs
      for (const recipientId of removeDto.recipient_ids) {
        if (!this.isValidUUID(recipientId)) {
          throw new BadRequestException(`Invalid Recipient ID format: ${recipientId}`);
        }
      }

      const data = this.loadFromFile();
      const group = data.groups.find(g => g.id === id && g.is_active);
      
      if (!group) {
        throw new NotFoundException(`Notification group with ID "${id}" not found`);
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const recipientId of removeDto.recipient_ids) {
        const recipientIndex = data.recipients.findIndex(r => 
          r.id === recipientId && r.group_id === id && r.is_active
        );

        if (recipientIndex !== -1) {
          data.recipients[recipientIndex].is_active = false;
          success++;
        } else {
          errors.push(`Recipient ${recipientId} not found or already removed`);
          failed++;
        }
      }

      // Update recipient count
      const groupIndex = data.groups.findIndex(g => g.id === id);
      if (groupIndex !== -1) {
        data.groups[groupIndex].recipient_count = Math.max((data.groups[groupIndex].recipient_count || 0) - success, 0);
      }

      this.saveToFile(data);

      const result: BulkOperationResponseDto = {
        success,
        failed,
        total: removeDto.recipient_ids.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `${success} recipients removed successfully. ${failed} failed.`
      };

      return Promise.resolve(this.createResponse(true, 'Bulk remove operation completed', result));
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to remove recipients'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Helper method for adding single recipient
  private addSingleRecipient(groupId: string, addRecipientDto: AddRecipientDto, group: NotificationGroup, data: NotificationsData): Promise<ApiResponse<Recipient>> {
    if (!this.isValidUUID(addRecipientDto.user_id)) {
      throw new BadRequestException('Invalid User ID format');
    }

    // Validate contact type matches group type
    if ((group.group_type?.name === 'whatsapp' || group.group_type?.name === 'sms') && addRecipientDto.contact_type !== ContactType.PHONE) {
      throw new BadRequestException(`${group.group_type.name.toUpperCase()} groups can only contain phone contacts`);
    }
    
    if (group.group_type?.name === 'email' && addRecipientDto.contact_type !== ContactType.EMAIL) {
      throw new BadRequestException('Email groups can only contain email contacts');
    }

    // Check if recipient already exists
    const existingRecipient = data.recipients.find(r => 
      r.group_id === groupId && 
      r.user_id === addRecipientDto.user_id && 
      r.contact_type === addRecipientDto.contact_type && 
      r.is_active
    );

    if (existingRecipient) {
      throw new BadRequestException('User is already a recipient in this group');
    }

    // Find available contact
    const availableContact = data.availableContacts.find(c => c.user_id === addRecipientDto.user_id);
    if (!availableContact) {
      throw new NotFoundException(`User with ID "${addRecipientDto.user_id}" not found`);
    }

    // Get contact value
    let contactValue = '';
    if (addRecipientDto.contact_type === ContactType.PHONE) {
      if (!availableContact.phone_number) {
        throw new BadRequestException(`User "${availableContact.user_name}" does not have a phone number`);
      }
      contactValue = availableContact.phone_number;
    } else {
      if (!availableContact.email) {
        throw new BadRequestException(`User "${availableContact.user_name}" does not have an email address`);
      }
      contactValue = availableContact.email;
    }

    const newRecipient: Recipient = {
      id: this.generateUUID(),
      user_id: addRecipientDto.user_id,
      group_id: groupId,
      contact_value: contactValue,
      contact_type: addRecipientDto.contact_type,
      is_active: true,
      added_at: new Date().toISOString(),
      added_by: 'user001',
      user_name: availableContact.user_name,
      user_email: availableContact.email || '',
      added_by_name: 'Shuchi Sirpal'
    };

    data.recipients.push(newRecipient);
    
    // Update recipient count
    const groupIndex = data.groups.findIndex(g => g.id === groupId);
    if (groupIndex !== -1) {
      data.groups[groupIndex].recipient_count = (data.groups[groupIndex].recipient_count || 0) + 1;
    }

    this.saveToFile(data);

    return Promise.resolve(this.createResponse(true, 'Recipient added successfully', newRecipient));
  }

  // Helper method for adding multiple recipients
  private addMultipleRecipientsInternal(groupId: string, addMultipleDto: AddMultipleRecipientsDto, group: NotificationGroup, data: NotificationsData): Promise<ApiResponse<BulkOperationResponseDto>> {
    // Validate all user IDs
    for (const userId of addMultipleDto.user_ids) {
      if (!this.isValidUUID(userId)) {
        throw new BadRequestException(`Invalid User ID format: ${userId}`);
      }
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    const addedRecipients: Recipient[] = [];

    for (const userId of addMultipleDto.user_ids) {
      try {
        // Check if recipient already exists
        const existingRecipient = data.recipients.find(r => 
          r.group_id === groupId && 
          r.user_id === userId && 
          r.contact_type === addMultipleDto.contact_type && 
          r.is_active
        );

        if (existingRecipient) {
          errors.push(`User ${userId} is already a recipient in this group`);
          failed++;
          continue;
        }

        // Find available contact
        const availableContact = data.availableContacts.find(c => c.user_id === userId);
        if (!availableContact) {
          errors.push(`User ${userId} not found`);
          failed++;
          continue;
        }

        // Get contact value
        let contactValue = '';
        if (addMultipleDto.contact_type === ContactType.PHONE) {
          if (!availableContact.phone_number) {
            errors.push(`User "${availableContact.user_name}" does not have a phone number`);
            failed++;
            continue;
          }
          contactValue = availableContact.phone_number;
        } else {
          if (!availableContact.email) {
            errors.push(`User "${availableContact.user_name}" does not have an email address`);
            failed++;
            continue;
          }
          contactValue = availableContact.email;
        }

        const newRecipient: Recipient = {
          id: this.generateUUID(),
          user_id: userId,
          group_id: groupId,
          contact_value: contactValue,
          contact_type: addMultipleDto.contact_type,
          is_active: true,
          added_at: new Date().toISOString(),
          added_by: 'user001',
          user_name: availableContact.user_name,
          user_email: availableContact.email || '',
          added_by_name: 'Shuchi Sirpal'
        };

        data.recipients.push(newRecipient);
        addedRecipients.push(newRecipient);
        success++;

      } catch (error) {
        errors.push(`Failed to add user ${userId}: ${error.message}`);
        failed++;
      }
    }

    // Update recipient count
    const groupIndex = data.groups.findIndex(g => g.id === groupId);
    if (groupIndex !== -1) {
      data.groups[groupIndex].recipient_count = (data.groups[groupIndex].recipient_count || 0) + success;
    }

    this.saveToFile(data);

    const result: BulkOperationResponseDto = {
      success,
      failed,
      total: addMultipleDto.user_ids.length,
      updated_recipients: addedRecipients,
      errors: errors.length > 0 ? errors : undefined,
      message: `${success} recipients added successfully. ${failed} failed.`
    };

    return Promise.resolve(this.createResponse(true, 'Bulk add operation completed', result));
  }
}
