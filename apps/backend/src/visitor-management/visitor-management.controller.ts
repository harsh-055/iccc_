import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Query, 
  Body, 
  HttpStatus, 
  HttpException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

// Interfaces
export interface RecentAlert {
  alertName: string;
  location: string;
  severity: 'Critical' | 'Warning' | 'Info';
  time: string;
}

export interface DashboardStats {
  totalVisitors: number;
  currentVisitorsInside: number;
  activeEntryGates: number;
  deniedEntries: number;
  repeatVisitorCount: number;
  averageTime: string;
}

export interface PeakVisitorHours {
  time: string;
  visitors: number;
}

export interface LiveMonitoringFeed {
  id: string;
  name: string;
  location: string;
  videoUrl: string;
  thumbnailUrl: string;
  isActive: boolean;
  cameraType: string;
}

export interface VisitorLog {
  visitorName: string;
  purpose: string;
  entryPoint: string;
  date: string;
  time: string;
  status: 'Inside' | 'Checked Out' | 'Flagged';
  qrCode: string;
  actions: string;
}

export interface EntryRequest {
  id: string; // Add unique ID field
  visitorName: string;
  location: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  time: string;
  purpose: string;
  idType: string; // Change from 'id' to 'idType' to avoid confusion
  actions: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface VMSData {
  dashboardStats: DashboardStats;
  peakVisitorHours: PeakVisitorHours[];
  recentAlerts: RecentAlert[];
  liveMonitoringFeeds: LiveMonitoringFeed[];
  visitorLogs: VisitorLog[];
  entryRequests: EntryRequest[];
}

@ApiTags('Visitor Management System')
@Controller('visitor-management')
export class VisitorManagementController {
  
  // Path to store the JSON file
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'vms-data.json');

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
      this.saveToFile(this.getDefaultVMSData());
    }
  }

  // Load VMS data from JSON file
  private loadFromFile(): VMSData {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf8');
        return JSON.parse(data);
      }
      return this.getDefaultVMSData();
    } catch (error) {
      console.error('Error loading VMS data from file:', error);
      return this.getDefaultVMSData();
    }
  }

  // Save VMS data to JSON file
  private saveToFile(vmsData: VMSData): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(vmsData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving VMS data to file:', error);
      throw new HttpException('Failed to save VMS data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get default VMS data
  private getDefaultVMSData(): VMSData {
    return {
      dashboardStats: {
        totalVisitors: 47,
        currentVisitorsInside: 8,
        activeEntryGates: 3,
        deniedEntries: 2,
        repeatVisitorCount: 15,
        averageTime: '22 minutes'
      },
      peakVisitorHours: [
        { time: '9:00 AM', visitors: 38 },
        { time: '10:00 AM', visitors: 42 },
        { time: '11:00 AM', visitors: 48 },
        { time: '12:00 PM', visitors: 55 },
        { time: '1:00 PM', visitors: 62 },
        { time: '2:00 PM', visitors: 58 },
        { time: '3:00 PM', visitors: 53 },
        { time: '4:00 PM', visitors: 49 },
        { time: '5:00 PM', visitors: 45 },
        { time: '6:00 PM', visitors: 41 },
        { time: '7:00 PM', visitors: 36 },
        { time: '8:00 PM', visitors: 32 }
      ],
      recentAlerts: [
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        },
        {
          alertName: 'Alert Name',
          location: 'Smart City Office',
          severity: 'Critical',
          time: '4 minutes ago'
        }
      ],
      liveMonitoringFeeds: [
        {
          id: 'CAM001',
          name: 'Entry Gate 1',
          location: 'Smart City Office - Main Entrance',
          videoUrl: 'https://www.youtube.com/embed/ByED80IKdIU?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=1',
          isActive: true,
          cameraType: 'Entry Gate'
        },
        {
          id: 'CAM002',
          name: 'Reception Area',
          location: 'Smart City Office - Reception',
          videoUrl: 'https://www.youtube.com/embed/1-iS7LArMPA?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=2',
          isActive: true,
          cameraType: 'Indoor'
        },
        {
          id: 'CAM003',
          name: 'Parking Area',
          location: 'Smart City Office - Parking',
          videoUrl: 'https://www.youtube.com/embed/eJ7ZkQ5TC08?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=3',
          isActive: true,
          cameraType: 'Outdoor'
        },
        {
          id: 'CAM004',
          name: 'Corridor View',
          location: 'Smart City Office - Main Corridor',
          videoUrl: 'https://www.youtube.com/embed/wCcMcaiRbhM?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=4',
          isActive: true,
          cameraType: 'Indoor'
        },
        {
          id: 'CAM005',
          name: 'Exit Gate',
          location: 'Smart City Office - Exit',
          videoUrl: 'https://www.youtube.com/embed/V1Ay8hOLVU0?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=5',
          isActive: true,
          cameraType: 'Entry Gate'
        },
        {
          id: 'CAM006',
          name: 'Conference Room',
          location: 'Smart City Office - Meeting Room A',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=6',
          isActive: true,
          cameraType: 'Indoor'
        },
        {
          id: 'CAM007',
          name: 'Garden Area',
          location: 'Smart City Office - Garden',
          videoUrl: 'https://www.youtube.com/embed/5_XSYlAfJZM?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=7',
          isActive: true,
          cameraType: 'Outdoor'
        },
        {
          id: 'CAM008',
          name: 'Server Room',
          location: 'Smart City Office - IT Room',
          videoUrl: 'https://www.youtube.com/embed/ChOhcHD8fBA?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=8',
          isActive: false,
          cameraType: 'Security'
        },
        {
          id: 'CAM009',
          name: 'Cafeteria',
          location: 'Smart City Office - Food Court',
          videoUrl: 'https://www.youtube.com/embed/ddFvjfvPnqk?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=9',
          isActive: true,
          cameraType: 'Indoor'
        },
        {
          id: 'CAM010',
          name: 'Terrace View',
          location: 'Smart City Office - Rooftop',
          videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=10',
          isActive: true,
          cameraType: 'Outdoor'
        },
        {
          id: 'CAM011',
          name: 'Emergency Exit',
          location: 'Smart City Office - Emergency Gate',
          videoUrl: 'https://www.youtube.com/embed/HDntl7yzzVI?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=11',
          isActive: true,
          cameraType: 'Security'
        },
        {
          id: 'CAM012',
          name: 'Lobby Area',
          location: 'Smart City Office - Main Lobby',
          videoUrl: 'https://www.youtube.com/embed/qC0vDKVPCrw?autoplay=1&mute=1',
          thumbnailUrl: 'https://picsum.photos/320/240?random=12',
          isActive: true,
          cameraType: 'Indoor'
        }
      ],
      visitorLogs: [
        {
          visitorName: 'Rajesh Kumar',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '2 PM - 3 PM',
          status: 'Inside',
          qrCode: 'QRC008',
          actions: 'View Feed'
        },
        {
          visitorName: 'Priya Sharma',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '1 PM - 2 PM',
          status: 'Flagged',
          qrCode: 'QRC009',
          actions: 'View Feed'
        },
        {
          visitorName: 'Amit Singh',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 2',
          date: 'Today',
          time: '12 PM - 1 PM',
          status: 'Checked Out',
          qrCode: 'QRC010',
          actions: 'View Feed'
        },
        {
          visitorName: 'Sunita Gupta',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '11 AM - 12 PM',
          status: 'Checked Out',
          qrCode: 'QRC011',
          actions: 'View Feed'
        },
        {
          visitorName: 'Vikram Patel',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 3',
          date: 'Today',
          time: '10 AM - 11 AM',
          status: 'Checked Out',
          qrCode: 'QRC012',
          actions: 'View Feed'
        },
        {
          visitorName: 'Neha Agarwal',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '9 AM - 10 AM',
          status: 'Checked Out',
          qrCode: 'QRC013',
          actions: 'View Feed'
        },
        {
          visitorName: 'Rohit Verma',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 2',
          date: 'Today',
          time: '3 PM - 4 PM',
          status: 'Checked Out',
          qrCode: 'QRC014',
          actions: 'View Feed'
        },
        {
          visitorName: 'Kavita Joshi',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '2 PM - 3 PM',
          status: 'Checked Out',
          qrCode: 'QRC015',
          actions: 'View Feed'
        },
        {
          visitorName: 'Deepak Mehta',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '1 PM - 2 PM',
          status: 'Flagged',
          qrCode: 'QRC016',
          actions: 'View Feed'
        },
        {
          visitorName: 'Anjali Reddy',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 3',
          date: 'Today',
          time: '4 PM - 5 PM',
          status: 'Checked Out',
          qrCode: 'QRC017',
          actions: 'View Feed'
        },
        {
          visitorName: 'Manoj Yadav',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 2',
          date: 'Today',
          time: '11 AM - 12 PM',
          status: 'Checked Out',
          qrCode: 'QRC018',
          actions: 'View Feed'
        },
        {
          visitorName: 'Sonia Kapoor',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '10 AM - 11 AM',
          status: 'Checked Out',
          qrCode: 'QRC019',
          actions: 'View Feed'
        },
        {
          visitorName: 'Arjun Nair',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '3 PM - 4 PM',
          status: 'Flagged',
          qrCode: 'QRC020',
          actions: 'View Feed'
        },
        {
          visitorName: 'Pooja Bansal',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 2',
          date: 'Today',
          time: '2 PM - 3 PM',
          status: 'Inside',
          qrCode: 'QRC021',
          actions: 'View Feed'
        },
        {
          visitorName: 'Ravi Choudhary',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '1 PM - 2 PM',
          status: 'Checked Out',
          qrCode: 'QRC022',
          actions: 'View Feed'
        },
        {
          visitorName: 'Divya Mishra',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 3',
          date: 'Today',
          time: '4 PM - 5 PM',
          status: 'Inside',
          qrCode: 'QRC023',
          actions: 'View Feed'
        },
        {
          visitorName: 'Kiran Rao',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '9 AM - 10 AM',
          status: 'Inside',
          qrCode: 'QRC024',
          actions: 'View Feed'
        },
        {
          visitorName: 'Suresh Iyer',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 2',
          date: 'Today',
          time: '3 PM - 4 PM',
          status: 'Checked Out',
          qrCode: 'QRC025',
          actions: 'View Feed'
        },
        {
          visitorName: 'Meera Shah',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 1',
          date: 'Today',
          time: '2 PM - 3 PM',
          status: 'Inside',
          qrCode: 'QRC026',
          actions: 'View Feed'
        },
        {
          visitorName: 'Ashok Sinha',
          purpose: 'Water Board',
          entryPoint: 'Entry Gate 3',
          date: 'Today',
          time: '1 PM - 2 PM',
          status: 'Inside',
          qrCode: 'QRC027',
          actions: 'View Feed'
        }
      ],
      entryRequests: [
        {
          id: 'REQ001',
          visitorName: 'Rahul Gupta',
          location: 'Smart City Office',
          status: 'Pending',
          date: 'March 25, 2025',
          time: '3:00 PM',
          purpose: 'Meeting with Manager',
          idType: 'Aadhar Card',
          actions: ['Approve', 'Reject']
        },
        {
          id: 'REQ002',
          visitorName: 'Sneha Agrawal',
          location: 'Smart City Office',
          status: 'Pending',
          date: 'March 25, 2025',
          time: '2:30 PM',
          purpose: 'Meeting with Manager',
          idType: 'Aadhar Card',
          actions: ['Approve', 'Reject']
        },
        {
          id: 'REQ003',
          visitorName: 'Arpit Sharma',
          location: 'Smart City Office',
          status: 'Rejected',
          date: 'March 25, 2025',
          time: '2:00 PM',
          purpose: 'Meeting with Manager',
          idType: 'Aadhar Card',
          actions: ['View Details']
        },
        {
          id: 'REQ004',
          visitorName: 'Manisha Patel',
          location: 'Smart City Office',
          status: 'Pending',
          date: 'March 25, 2025',
          time: '4:00 PM',
          purpose: 'Meeting with Manager',
          idType: 'Pan Card',
          actions: ['Approve', 'Reject']
        },
        {
          id: 'REQ005',
          visitorName: 'Vikas Jain',
          location: 'Smart City Office',
          status: 'Pending',
          date: 'March 25, 2025',
          time: '1:30 PM',
          purpose: 'Meeting with Manager',
          idType: 'Driving License',
          actions: ['Approve', 'Reject']
        },
        {
          id: 'REQ006',
          visitorName: 'Lakshmi Nair',
          location: 'Smart City Office',
          status: 'Pending',
          date: 'March 25, 2025',
          time: '5:00 PM',
          purpose: 'Meeting with Manager',
          idType: 'Aadhar Card',
          actions: ['Approve', 'Reject']
        },
        {
          id: 'REQ007',
          visitorName: 'Sandeep Kumar',
          location: 'Smart City Office',
          status: 'Pending',
          date: 'March 25, 2025',
          time: '11:00 AM',
          purpose: 'Meeting with Manager',
          idType: 'Voter ID',
          actions: ['Approve', 'Reject']
        },
        {
          id: 'REQ008',
          visitorName: 'Rekha Singh',
          location: 'Smart City Office',
          status: 'Pending',
          date: 'March 25, 2025',
          time: '10:30 AM',
          purpose: 'Meeting with Manager',
          idType: 'Aadhar Card',
          actions: ['Approve', 'Reject']
        },
        {
          id: 'REQ009',
          visitorName: 'Anil Chopra',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 25, 2025',
          time: '9:00 AM',
          purpose: 'Meeting with Manager',
          idType: 'Pan Card',
          actions: ['View Details']
        },
        {
          id: 'REQ010',
          visitorName: 'Geeta Verma',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 25, 2025',
          time: '9:30 AM',
          purpose: 'Meeting with Manager',
          idType: 'Aadhar Card',
          actions: ['View Details']
        },
        {
          id: 'REQ011',
          visitorName: 'Sunil Yadav',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 24, 2025',
          time: '4:30 PM',
          purpose: 'Meeting with Manager',
          idType: 'Driving License',
          actions: ['View Details']
        },
        {
          id: 'REQ012',
          visitorName: 'Nita Bhargava',
          location: 'Smart City Office',
          status: 'Rejected',
          date: 'March 24, 2025',
          time: '3:15 PM',
          purpose: 'Meeting with Manager',
          idType: 'Voter ID',
          actions: ['View Details']
        },
        {
          id: 'REQ013',
          visitorName: 'Prakash Reddy',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 24, 2025',
          time: '2:45 PM',
          purpose: 'Meeting with Manager',
          idType: 'Aadhar Card',
          actions: ['View Details']
        },
        {
          id: 'REQ014',
          visitorName: 'Shweta Malhotra',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 24, 2025',
          time: '1:00 PM',
          purpose: 'Meeting with Manager',
          idType: 'Pan Card',
          actions: ['View Details']
        },
        {
          id: 'REQ015',
          visitorName: 'Harish Bhatia',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 24, 2025',
          time: '12:30 PM',
          purpose: 'Meeting with Manager',
          idType: 'Aadhar Card',
          actions: ['View Details']
        },
        {
          id: 'REQ016',
          visitorName: 'Kavya Menon',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 24, 2025',
          time: '11:15 AM',
          purpose: 'Meeting with Manager',
          idType: 'Driving License',
          actions: ['View Details']
        },
        {
          id: 'REQ017',
          visitorName: 'Rajat Saxena',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 24, 2025',
          time: '10:00 AM',
          purpose: 'Meeting with Manager',
          idType: 'Voter ID',
          actions: ['View Details']
        },
        {
          id: 'REQ018',
          visitorName: 'Preeti Khandelwal',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 23, 2025',
          time: '4:00 PM',
          purpose: 'Meeting with Manager',
          idType: 'Aadhar Card',
          actions: ['View Details']
        },
        {
          id: 'REQ019',
          visitorName: 'Ajay Bansal',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 23, 2025',
          time: '3:30 PM',
          purpose: 'Meeting with Manager',
          idType: 'Pan Card',
          actions: ['View Details']
        },
        {
          id: 'REQ020',
          visitorName: 'Shalini Tiwari',
          location: 'Smart City Office',
          status: 'Approved',
          date: 'March 23, 2025',
          time: '2:15 PM',
          purpose: 'Meeting with Manager',
          idType: 'Aadhar Card',
          actions: ['View Details']
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

  // Dashboard endpoint
  @Get('dashboard')
  @ApiOperation({ summary: 'Get visitor management dashboard data' })
  getDashboard(): Promise<ApiResponse<{
    stats: DashboardStats;
    peakHours: PeakVisitorHours[];
    recentAlerts: RecentAlert[];
  }>> {
    try {
      const vmsData = this.loadFromFile();
      const dashboardData = {
        stats: vmsData.dashboardStats,
        peakHours: vmsData.peakVisitorHours,
        recentAlerts: vmsData.recentAlerts
      };
      
      return Promise.resolve(this.createResponse(true, 'Dashboard data retrieved successfully', dashboardData));
    } catch (error) {
      throw new HttpException(
        this.createResponse(false, 'Failed to retrieve dashboard data'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Visitor logs endpoint with live monitoring
  @Get('visitor-logs')
  @ApiOperation({ summary: 'Get all visitor logs with live monitoring feeds' })
  getVisitorLogs(): Promise<ApiResponse<{
    visitorLogs: VisitorLog[];
    liveMonitoring: LiveMonitoringFeed[];
    stats: {
      totalVisitors: number;
      currentVisitorsInside: number;
      activeEntryGates: number;
    };
  }>> {
    try {
      const vmsData = this.loadFromFile();
      const data = {
        visitorLogs: vmsData.visitorLogs,
        liveMonitoring: vmsData.liveMonitoringFeeds,
        stats: {
          totalVisitors: vmsData.dashboardStats.totalVisitors,
          currentVisitorsInside: vmsData.dashboardStats.currentVisitorsInside,
          activeEntryGates: vmsData.dashboardStats.activeEntryGates
        }
      };
      
      return Promise.resolve(this.createResponse(true, 'Visitor logs with live monitoring retrieved successfully', data));
    } catch (error) {
      throw new HttpException(
        this.createResponse(false, 'Failed to retrieve visitor logs'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Entry requests endpoint
  @Get('entry-requests')
  @ApiOperation({ summary: 'Get all entry requests' })
  getEntryRequests(): Promise<ApiResponse<EntryRequest[]>> {
    try {
      const vmsData = this.loadFromFile();
      return Promise.resolve(this.createResponse(true, 'Entry requests retrieved successfully', vmsData.entryRequests));
    } catch (error) {
      throw new HttpException(
        this.createResponse(false, 'Failed to retrieve entry requests'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Update entry request status
  @Put('entry-requests/:id/status')
  @ApiOperation({ summary: 'Update entry request status' })
  @ApiBody({
    description: 'Update entry request status',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          enum: ['Pending', 'Approved', 'Rejected'], 
          example: 'Approved'
        }
      },
      required: ['status']
    }
  })
  updateEntryRequestStatus(
    @Param('id') id: string,
    @Body() body: { status: 'Pending' | 'Approved' | 'Rejected' }
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const vmsData = this.loadFromFile();
      const entryRequestIndex = vmsData.entryRequests.findIndex(req => req.id === id);
      
      if (entryRequestIndex === -1) {
        throw new HttpException(
          this.createResponse(false, `Entry request '${id}' not found`),
          HttpStatus.NOT_FOUND
        );
      }

      // Update the status
      vmsData.entryRequests[entryRequestIndex].status = body.status;
      
      // Update actions based on status
      if (body.status === 'Approved' || body.status === 'Rejected') {
        vmsData.entryRequests[entryRequestIndex].actions = ['View Details'];
      }

      // Save the updated data
      this.saveToFile(vmsData);

      return Promise.resolve(this.createResponse(true, `Entry request ${id} status updated to ${body.status}`, {
        message: `Status updated successfully`
      }));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to update entry request status'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
