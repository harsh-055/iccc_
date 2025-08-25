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
  HttpException,
  BadRequestException,
  NotFoundException,
  HttpCode
} from '@nestjs/common';
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

// Import DTOs from the existing module
import { 
  VideoManagementResponseDto, 
  DashboardOverviewDto, 
  WasteManagementResponseDto, 
  WasteBreakdownDto,
  AlertsResponseDto, 
  GarbageMovementResponseDto 
} from './dto/video-management.dto';

// Interfaces
export interface Camera {
  Camera_id: string;
  Camera_name: string;
  Status: 'is_active' | 'is_inactive' | 'maintenance';
  StreamUrl: string;
  Created_at: string;
  Updated_at: string;
  lastPosition?: string;
  thumbnailUrl: string;
}

export interface Sector {
  Sector_name: string;
  lat: string;
  long: string;
  Camera: Camera[];
}

export interface City {
  City: string;
  Sector: Sector[];
}

export interface VideoSegment {
  id: string;
  Camera_id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  fileSize: string;
  quality: '720p' | '1080p' | '4K';
  hasAudio: boolean;
}

export interface PlaybackSession {
  id: string;
  Camera_id: string;
  userId: string;
  currentTime: string; // HH:MM:SS format
  currentDate: string; // YYYY-MM-DD format
  isPlaying: boolean;
  startedAt: Date;
  lastUpdated: Date;
  playbackSpeed: number; // 1x, 2x, 4x, etc.
}

export interface StartPlaybackDto {
  Camera_id: string;
  userId: string;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:MM:SS
}

export interface UpdatePlaybackDto {
  currentTime?: string;
  currentDate?: string;
  isPlaying?: boolean;
  playbackSpeed?: number;
}

export interface VehicleCoordinate {
  latitude: number;
  longitude: number;
}

export interface Facility {
  [facilityName: string]: VehicleCoordinate[];
}

export interface Route {
  name: string;
  description: string;
  facilities_positions: Facility[];
}

export interface Vehicle {
  vehicle_type: string;
  vehicle_number: string;
  vehicle_coordinates: VehicleCoordinate[];
  route: Route;
}

export interface VehicleResponse {
  vehicle: Vehicle[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

// New interface for storing all VMS data
export interface VmsData {
  cities: City[];
  playbackSessions: PlaybackSession[];
  vehicleData: VehicleResponse;
}

@ApiTags('Monitoring Video Management')
@Controller('monitoring/video-management')
export class MergedVideoManagementController {
  
  // Mock data for video management (from the smaller controller)
  private mockData: VideoManagementResponseDto = {
    city: {
      name: 'Gurugram',
      sectors: [
        {
          id: 'sector-39',
          name: 'Sector 39',
          cameras: [
            {
              id: 'camera-1',
              name: 'Camera 1',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.100:554/stream1',
              last_update: new Date().toISOString(),
              latitude: 28.4595,
              longitude: 77.0266
            },
            {
              id: 'camera-2',
              name: 'Camera 2',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.101:554/stream2',
              last_update: new Date().toISOString(),
              latitude: 28.4605,
              longitude: 77.0276
            },
            {
              id: 'camera-3',
              name: 'Camera 3',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.102:554/stream3',
              last_update: new Date().toISOString(),
              latitude: 28.4615,
              longitude: 77.0286
            },
            {
              id: 'camera-4',
              name: 'Camera 4',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.103:554/stream4',
              last_update: new Date().toISOString(),
              latitude: 28.4625,
              longitude: 77.0296
            },
            {
              id: 'camera-5',
              name: 'Camera 5',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.104:554/stream5',
              last_update: new Date().toISOString(),
              latitude: 28.4635,
              longitude: 77.0306
            },
            {
              id: 'camera-6',
              name: 'Camera 6',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.105:554/stream6',
              last_update: new Date().toISOString(),
              latitude: 28.4645,
              longitude: 77.0316
            },
            {
              id: 'camera-7',
              name: 'Camera 7',
              status: 'inactive',
              rtsp_url: 'rtsp://192.168.1.106:554/stream7',
              last_update: new Date().toISOString(),
              latitude: 28.4655,
              longitude: 77.0326
            }
          ]
        },
        {
          id: 'sector-40',
          name: 'Sector 40',
          cameras: [
            {
              id: 'camera-8',
              name: 'Camera 8',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.107:554/stream8',
              last_update: new Date().toISOString(),
              latitude: 28.4665,
              longitude: 77.0336
            },
            {
              id: 'camera-9',
              name: 'Camera 9',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.108:554/stream9',
              last_update: new Date().toISOString(),
              latitude: 28.4675,
              longitude: 77.0346
            },
            {
              id: 'camera-10',
              name: 'Camera 10',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.109:554/stream10',
              last_update: new Date().toISOString(),
              latitude: 28.4685,
              longitude: 77.0356
            },
            {
              id: 'camera-11',
              name: 'Camera 11',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.110:554/stream11',
              last_update: new Date().toISOString(),
              latitude: 28.4695,
              longitude: 77.0366
            },
            {
              id: 'camera-12',
              name: 'Camera 12',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.111:554/stream12',
              last_update: new Date().toISOString(),
              latitude: 28.4705,
              longitude: 77.0376
            },
            {
              id: 'camera-13',
              name: 'Camera 13',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.112:554/stream13',
              last_update: new Date().toISOString(),
              latitude: 28.4715,
              longitude: 77.0386
            },
            {
              id: 'camera-14',
              name: 'Camera 14',
              status: 'inactive',
              rtsp_url: 'rtsp://192.168.1.113:554/stream14',
              last_update: new Date().toISOString(),
              latitude: 28.4725,
              longitude: 77.0396
            }
          ]
        },
        {
          id: 'sector-41',
          name: 'Sector 41',
          cameras: [
            {
              id: 'camera-15',
              name: 'Camera 15',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.114:554/stream15',
              last_update: new Date().toISOString(),
              latitude: 28.4735,
              longitude: 77.0406
            },
            {
              id: 'camera-16',
              name: 'Camera 16',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.115:554/stream16',
              last_update: new Date().toISOString(),
              latitude: 28.4745,
              longitude: 77.0416
            },
            {
              id: 'camera-17',
              name: 'Camera 17',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.116:554/stream17',
              last_update: new Date().toISOString(),
              latitude: 28.4755,
              longitude: 77.0426
            },
            {
              id: 'camera-18',
              name: 'Camera 18',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.117:554/stream18',
              last_update: new Date().toISOString(),
              latitude: 28.4765,
              longitude: 77.0436
            },
            {
              id: 'camera-19',
              name: 'Camera 19',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.118:554/stream19',
              last_update: new Date().toISOString(),
              latitude: 28.4775,
              longitude: 77.0446
            },
            {
              id: 'camera-20',
              name: 'Camera 20',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.119:554/stream20',
              last_update: new Date().toISOString(),
              latitude: 28.4785,
              longitude: 77.0456
            },
            {
              id: 'camera-21',
              name: 'Camera 21',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.120:554/stream21',
              last_update: new Date().toISOString(),
              latitude: 28.4795,
              longitude: 77.0466
            }
          ]
        },
        {
          id: 'sector-42',
          name: 'Sector 42',
          cameras: [
            {
              id: 'camera-22',
              name: 'Camera 22',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.121:554/stream22',
              last_update: new Date().toISOString(),
              latitude: 28.4805,
              longitude: 77.0476
            },
            {
              id: 'camera-23',
              name: 'Camera 23',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.122:554/stream23',
              last_update: new Date().toISOString(),
              latitude: 28.4815,
              longitude: 77.0486
            },
            {
              id: 'camera-24',
              name: 'Camera 24',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.123:554/stream24',
              last_update: new Date().toISOString(),
              latitude: 28.4825,
              longitude: 77.0496
            },
            {
              id: 'camera-25',
              name: 'Camera 25',
              status: 'active',
              rtsp_url: 'rtsp://192.168.1.124:554/stream25',
              last_update: new Date().toISOString(),
              latitude: 28.4835,
              longitude: 77.0506
            }
          ]
        }
      ]
    },
    total_cameras: 25,
    total_active_cameras: 23,
    total_inactive_cameras: 2
  };

  // Path to store the JSON file
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'mvm-data.json');
  
  // In-memory session tracking (still needed for quick lookups)
  private playbackSessions: Map<string, PlaybackSession> = new Map();
  private userSessions: Map<string, string[]> = new Map();

  constructor() {
    // Ensure data directory exists
    this.ensureDataDirectory();
    // Initialize with default data if file doesn't exist
    this.initializeData();
    // Load sessions into memory
    this.loadSessionsIntoMemory();
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
      this.saveToFile(this.getDefaultVmsData());
    }
  }

  // Load VMS data from JSON file
  private loadFromFile(): VmsData {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf8');
        return JSON.parse(data);
      }
      return this.getDefaultVmsData();
    } catch (error) {
      console.error('Error loading VMS data from file:', error);
      return this.getDefaultVmsData();
    }
  }

  // Save VMS data to JSON file
  private saveToFile(vmsData: VmsData): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(vmsData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving VMS data to file:', error);
      throw new HttpException('Failed to save VMS data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Load sessions into memory for quick access
  private loadSessionsIntoMemory(): void {
    const data = this.loadFromFile();
    this.playbackSessions.clear();
    this.userSessions.clear();

    data.playbackSessions.forEach(session => {
      this.playbackSessions.set(session.id, session);
      
      if (!this.userSessions.has(session.userId)) {
        this.userSessions.set(session.userId, []);
      }
      this.userSessions.get(session.userId)!.push(session.id);
    });
  }

  // Save sessions from memory to file
  private saveSessionsToFile(): void {
    const data = this.loadFromFile();
    data.playbackSessions = Array.from(this.playbackSessions.values());
    this.saveToFile(data);
  }

  // Get default VMS data (comprehensive mock data)
  private getDefaultVmsData(): VmsData {
    return {
      cities: [
        {
          City: "Gurugram",
          Sector: [
            {
              Sector_name: "Sector21",
              lat: "28.459245",
              long: "77.026834",
              Camera: [
                {
                  Camera_id: "Cam-11103",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-11103",
                  Created_at: "2024-03-15T10:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-11103/thumb.jpg"
                },
                {
                  Camera_id: "Cam-11267",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-11267",
                  Created_at: "2024-01-20T08:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-11267/thumb.jpg"
                },
                {
                  Camera_id: "Cam-11334",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-11334",
                  Created_at: "2024-05-10T14:22:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-11334/thumb.jpg"
                },
                {
                  Camera_id: "Cam-11445",
                  Camera_name: "Camera4",
                  Status: "maintenance",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-11445",
                  Created_at: "2024-02-28T11:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-11445/thumb.jpg"
                },
                {
                  Camera_id: "Cam-11556",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-11556",
                  Created_at: "2024-07-12T16:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-11556/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector22",
              lat: "28.465123",
              long: "77.031245",
              Camera: [
                {
                  Camera_id: "Cam-12201",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-12201",
                  Created_at: "2024-04-05T09:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-12201/thumb.jpg"
                },
                {
                  Camera_id: "Cam-12312",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-12312",
                  Created_at: "2024-06-18T13:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-12312/thumb.jpg"
                },
                {
                  Camera_id: "Cam-12423",
                  Camera_name: "Camera3",
                  Status: "is_inactive",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-12423",
                  Created_at: "2024-01-30T10:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-12423/thumb.jpg"
                },
                {
                  Camera_id: "Cam-12534",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-12534",
                  Created_at: "2024-03-25T15:10:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-12534/thumb.jpg"
                },
                {
                  Camera_id: "Cam-12645",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-12645",
                  Created_at: "2024-08-01T12:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-12645/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector23",
              lat: "28.470456",
              long: "77.035678",
              Camera: [
                {
                  Camera_id: "Cam-13301",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-13301",
                  Created_at: "2024-05-20T11:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-13301/thumb.jpg"
                },
                {
                  Camera_id: "Cam-13412",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-13412",
                  Created_at: "2024-03-10T14:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-13412/thumb.jpg"
                },
                {
                  Camera_id: "Cam-13523",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-13523",
                  Created_at: "2024-07-25T16:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-13523/thumb.jpg"
                },
                {
                  Camera_id: "Cam-13634",
                  Camera_name: "Camera4",
                  Status: "maintenance",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-13634",
                  Created_at: "2024-02-15T09:55:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-13634/thumb.jpg"
                },
                {
                  Camera_id: "Cam-13745",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-13745",
                  Created_at: "2024-06-30T13:40:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-13745/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector24",
              lat: "28.475890",
              long: "77.040123",
              Camera: [
                {
                  Camera_id: "Cam-14401",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-14401",
                  Created_at: "2024-01-08T12:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-14401/thumb.jpg"
                },
                {
                  Camera_id: "Cam-14512",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-14512",
                  Created_at: "2024-04-22T15:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-14512/thumb.jpg"
                },
                {
                  Camera_id: "Cam-14623",
                  Camera_name: "Camera3",
                  Status: "is_inactive",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-14623",
                  Created_at: "2024-08-10T10:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-14623/thumb.jpg"
                },
                {
                  Camera_id: "Cam-14734",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-14734",
                  Created_at: "2024-05-15T11:50:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-14734/thumb.jpg"
                },
                {
                  Camera_id: "Cam-14845",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-14845",
                  Created_at: "2024-03-05T14:10:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-14845/thumb.jpg"
                }
              ]
            }
          ]
        },
        {
          City: "Delhi",
          Sector: [
            {
              Sector_name: "Sector21",
              lat: "28.708256",
              long: "77.098745",
              Camera: [
                {
                  Camera_id: "Cam-21101",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-21101",
                  Created_at: "2024-02-14T11:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-21101/thumb.jpg"
                },
                {
                  Camera_id: "Cam-21212",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-21212",
                  Created_at: "2024-05-22T14:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-21212/thumb.jpg"
                },
                {
                  Camera_id: "Cam-21323",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-21323",
                  Created_at: "2024-01-10T09:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-21323/thumb.jpg"
                },
                {
                  Camera_id: "Cam-21434",
                  Camera_name: "Camera4",
                  Status: "maintenance",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-21434",
                  Created_at: "2024-04-18T16:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-21434/thumb.jpg"
                },
                {
                  Camera_id: "Cam-21545",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-21545",
                  Created_at: "2024-07-05T13:40:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-21545/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector22",
              lat: "28.712345",
              long: "77.103456",
              Camera: [
                {
                  Camera_id: "Cam-22201",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-22201",
                  Created_at: "2024-06-12T10:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-22201/thumb.jpg"
                },
                {
                  Camera_id: "Cam-22312",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-22312",
                  Created_at: "2024-03-28T13:50:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-22312/thumb.jpg"
                },
                {
                  Camera_id: "Cam-22423",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-22423",
                  Created_at: "2024-08-15T15:35:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-22423/thumb.jpg"
                },
                {
                  Camera_id: "Cam-22534",
                  Camera_name: "Camera4",
                  Status: "is_inactive",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-22534",
                  Created_at: "2024-01-25T12:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-22534/thumb.jpg"
                },
                {
                  Camera_id: "Cam-22645",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-22645",
                  Created_at: "2024-05-08T14:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-22645/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector23",
              lat: "28.716789",
              long: "77.108123",
              Camera: [
                {
                  Camera_id: "Cam-23101",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-23101",
                  Created_at: "2024-03-08T10:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-23101/thumb.jpg"
                },
                {
                  Camera_id: "Cam-23212",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-23212",
                  Created_at: "2024-06-12T15:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-23212/thumb.jpg"
                },
                {
                  Camera_id: "Cam-23323",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-23323",
                  Created_at: "2024-01-25T12:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-23323/thumb.jpg"
                },
                {
                  Camera_id: "Cam-23434",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-23434",
                  Created_at: "2024-04-30T14:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-23434/thumb.jpg"
                },
                {
                  Camera_id: "Cam-23545",
                  Camera_name: "Camera5",
                  Status: "is_inactive",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-23545",
                  Created_at: "2024-08-10T11:10:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-23545/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector24",
              lat: "28.721234",
              long: "77.112678",
              Camera: [
                {
                  Camera_id: "Cam-24401",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-24401",
                  Created_at: "2024-07-20T09:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-24401/thumb.jpg"
                },
                {
                  Camera_id: "Cam-24512",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-24512",
                  Created_at: "2024-02-18T11:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-24512/thumb.jpg"
                },
                {
                  Camera_id: "Cam-24623",
                  Camera_name: "Camera3",
                  Status: "maintenance",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-24623",
                  Created_at: "2024-05-05T16:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-24623/thumb.jpg"
                },
                {
                  Camera_id: "Cam-24734",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-24734",
                  Created_at: "2024-01-15T13:55:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-24734/thumb.jpg"
                },
                {
                  Camera_id: "Cam-24845",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-24845",
                  Created_at: "2024-04-12T12:10:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-24845/thumb.jpg"
                }
              ]
            }
          ]
        },
        {
          City: "Mumbai",
          Sector: [
            {
              Sector_name: "Sector21",
              lat: "19.078256",
              long: "72.875432",
              Camera: [
                {
                  Camera_id: "Cam-31101",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-31101",
                  Created_at: "2024-02-20T09:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-31101/thumb.jpg"
                },
                {
                  Camera_id: "Cam-31212",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-31212",
                  Created_at: "2024-04-15T11:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-31212/thumb.jpg"
                },
                {
                  Camera_id: "Cam-31323",
                  Camera_name: "Camera3",
                  Status: "maintenance",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-31323",
                  Created_at: "2024-01-12T14:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-31323/thumb.jpg"
                },
                {
                  Camera_id: "Cam-31434",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-31434",
                  Created_at: "2024-06-08T16:35:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-31434/thumb.jpg"
                },
                {
                  Camera_id: "Cam-31545",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-31545",
                  Created_at: "2024-08-02T13:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-31545/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector22",
              lat: "19.082145",
              long: "72.881267",
              Camera: [
                {
                  Camera_id: "Cam-32201",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-32201",
                  Created_at: "2024-03-18T10:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-32201/thumb.jpg"
                },
                {
                  Camera_id: "Cam-32312",
                  Camera_name: "Camera2",
                  Status: "is_inactive",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-32312",
                  Created_at: "2024-05-25T12:40:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-32312/thumb.jpg"
                },
                {
                  Camera_id: "Cam-32423",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-32423",
                  Created_at: "2024-07-10T15:55:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-32423/thumb.jpg"
                },
                {
                  Camera_id: "Cam-32534",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-32534",
                  Created_at: "2024-02-05T09:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-32534/thumb.jpg"
                },
                {
                  Camera_id: "Cam-32645",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-32645",
                  Created_at: "2024-04-22T14:18:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-32645/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector23",
              lat: "19.076534",
              long: "72.878901",
              Camera: [
                {
                  Camera_id: "Cam-33301",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-33301",
                  Created_at: "2024-01-28T11:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-33301/thumb.jpg"
                },
                {
                  Camera_id: "Cam-33412",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-33412",
                  Created_at: "2024-06-15T16:40:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-33412/thumb.jpg"
                },
                {
                  Camera_id: "Cam-33523",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-33523",
                  Created_at: "2024-03-30T13:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-33523/thumb.jpg"
                },
                {
                  Camera_id: "Cam-33634",
                  Camera_name: "Camera4",
                  Status: "maintenance",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-33634",
                  Created_at: "2024-08-05T10:50:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-33634/thumb.jpg"
                },
                {
                  Camera_id: "Cam-33745",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-33745",
                  Created_at: "2024-05-12T12:05:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-33745/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector24",
              lat: "19.084367",
              long: "72.873456",
              Camera: [
                {
                  Camera_id: "Cam-34401",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-34401",
                  Created_at: "2024-02-18T14:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-34401/thumb.jpg"
                },
                {
                  Camera_id: "Cam-34512",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-34512",
                  Created_at: "2024-07-20T09:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-34512/thumb.jpg"
                },
                {
                  Camera_id: "Cam-34623",
                  Camera_name: "Camera3",
                  Status: "is_inactive",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-34623",
                  Created_at: "2024-04-08T15:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-34623/thumb.jpg"
                },
                {
                  Camera_id: "Cam-34734",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-34734",
                  Created_at: "2024-06-25T11:35:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-34734/thumb.jpg"
                },
                {
                  Camera_id: "Cam-34845",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-34845",
                  Created_at: "2024-01-15T16:10:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-34845/thumb.jpg"
                }
              ]
            }
          ]
        },
        {
          City: "Bangalore",
          Sector: [
            {
              Sector_name: "Sector21",
              lat: "12.973456",
              long: "77.592134",
              Camera: [
                {
                  Camera_id: "Cam-41101",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-41101",
                  Created_at: "2024-03-12T10:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-41101/thumb.jpg"
                },
                {
                  Camera_id: "Cam-41212",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-41212",
                  Created_at: "2024-05-18T13:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-41212/thumb.jpg"
                },
                {
                  Camera_id: "Cam-41323",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-41323",
                  Created_at: "2024-07-03T15:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-41323/thumb.jpg"
                },
                {
                  Camera_id: "Cam-41434",
                  Camera_name: "Camera4",
                  Status: "maintenance",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-41434",
                  Created_at: "2024-01-22T09:40:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-41434/thumb.jpg"
                },
                {
                  Camera_id: "Cam-41545",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-41545",
                  Created_at: "2024-04-28T12:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-41545/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector22",
              lat: "12.978123",
              long: "77.597856",
              Camera: [
                {
                  Camera_id: "Cam-42201",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-42201",
                  Created_at: "2024-02-25T11:10:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-42201/thumb.jpg"
                },
                {
                  Camera_id: "Cam-42312",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-42312",
                  Created_at: "2024-06-10T14:35:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-42312/thumb.jpg"
                },
                {
                  Camera_id: "Cam-42423",
                  Camera_name: "Camera3",
                  Status: "is_inactive",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-42423",
                  Created_at: "2024-08-15T16:50:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-42423/thumb.jpg"
                },
                {
                  Camera_id: "Cam-42534",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-42534",
                  Created_at: "2024-03-05T13:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-42534/thumb.jpg"
                },
                {
                  Camera_id: "Cam-42645",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-42645",
                  Created_at: "2024-07-12T10:05:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-42645/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector23",
              lat: "12.969876",
              long: "77.594523",
              Camera: [
                {
                  Camera_id: "Cam-43301",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-43301",
                  Created_at: "2024-01-08T12:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-43301/thumb.jpg"
                },
                {
                  Camera_id: "Cam-43412",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-43412",
                  Created_at: "2024-05-30T15:40:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-43412/thumb.jpg"
                },
                {
                  Camera_id: "Cam-43523",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-43523",
                  Created_at: "2024-04-18T09:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-43523/thumb.jpg"
                },
                {
                  Camera_id: "Cam-43634",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-43634",
                  Created_at: "2024-08-08T14:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-43634/thumb.jpg"
                },
                {
                  Camera_id: "Cam-43745",
                  Camera_name: "Camera5",
                  Status: "maintenance",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-43745",
                  Created_at: "2024-06-20T11:50:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-43745/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector24",
              lat: "12.975234",
              long: "77.599012",
              Camera: [
                {
                  Camera_id: "Cam-44401",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-44401",
                  Created_at: "2024-02-10T13:55:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-44401/thumb.jpg"
                },
                {
                  Camera_id: "Cam-44512",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-44512",
                  Created_at: "2024-07-25T10:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-44512/thumb.jpg"
                },
                {
                  Camera_id: "Cam-44623",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-44623",
                  Created_at: "2024-03-28T16:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-44623/thumb.jpg"
                },
                {
                  Camera_id: "Cam-44734",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-44734",
                  Created_at: "2024-05-15T12:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-44734/thumb.jpg"
                },
                {
                  Camera_id: "Cam-44845",
                  Camera_name: "Camera5",
                  Status: "is_inactive",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-44845",
                  Created_at: "2024-01-30T08:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-44845/thumb.jpg"
                }
              ]
            }
          ]
        },
        {
          City: "Pune",
          Sector: [
            {
              Sector_name: "Sector21",
              lat: "18.522345",
              long: "73.854123",
              Camera: [
                {
                  Camera_id: "Cam-51101",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-51101",
                  Created_at: "2024-02-15T11:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-51101/thumb.jpg"
                },
                {
                  Camera_id: "Cam-51212",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-51212",
                  Created_at: "2024-06-05T14:10:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-51212/thumb.jpg"
                },
                {
                  Camera_id: "Cam-51323",
                  Camera_name: "Camera3",
                  Status: "maintenance",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-51323",
                  Created_at: "2024-04-12T09:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-51323/thumb.jpg"
                },
                {
                  Camera_id: "Cam-51434",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-51434",
                  Created_at: "2024-08-18T16:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-51434/thumb.jpg"
                },
                {
                  Camera_id: "Cam-51545",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-51545",
                  Created_at: "2024-01-25T12:55:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-51545/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector22",
              lat: "18.518756",
              long: "73.858934",
              Camera: [
                {
                  Camera_id: "Cam-52201",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-52201",
                  Created_at: "2024-03-20T10:40:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-52201/thumb.jpg"
                },
                {
                  Camera_id: "Cam-52312",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-52312",
                  Created_at: "2024-07-08T13:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-52312/thumb.jpg"
                },
                {
                  Camera_id: "Cam-52423",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-52423",
                  Created_at: "2024-05-02T15:50:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-52423/thumb.jpg"
                },
                {
                  Camera_id: "Cam-52534",
                  Camera_name: "Camera4",
                  Status: "is_inactive",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-52534",
                  Created_at: "2024-02-28T08:35:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-52534/thumb.jpg"
                },
                {
                  Camera_id: "Cam-52645",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-52645",
                  Created_at: "2024-06-18T14:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-52645/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector23",
              lat: "18.525167",
              long: "73.851687",
              Camera: [
                {
                  Camera_id: "Cam-53301",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-53301",
                  Created_at: "2024-01-18T11:15:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-53301/thumb.jpg"
                },
                {
                  Camera_id: "Cam-53412",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-53412",
                  Created_at: "2024-04-25T16:45:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-53412/thumb.jpg"
                },
                {
                  Camera_id: "Cam-53523",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-53523",
                  Created_at: "2024-08-12T12:30:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-53523/thumb.jpg"
                },
                {
                  Camera_id: "Cam-53634",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-53634",
                  Created_at: "2024-03-08T09:55:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-53634/thumb.jpg"
                },
                {
                  Camera_id: "Cam-53745",
                  Camera_name: "Camera5",
                  Status: "maintenance",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-53745",
                  Created_at: "2024-07-15T14:40:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-53745/thumb.jpg"
                }
              ]
            },
            {
              Sector_name: "Sector24",
              lat: "18.520834",
              long: "73.856245",
              Camera: [
                {
                  Camera_id: "Cam-54401",
                  Camera_name: "Camera1",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-54401",
                  Created_at: "2024-02-08T15:20:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-54401/thumb.jpg"
                },
                {
                  Camera_id: "Cam-54512",
                  Camera_name: "Camera2",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-54512",
                  Created_at: "2024-06-28T11:05:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-54512/thumb.jpg"
                },
                {
                  Camera_id: "Cam-54623",
                  Camera_name: "Camera3",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-54623",
                  Created_at: "2024-05-10T13:35:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-54623/thumb.jpg"
                },
                {
                  Camera_id: "Cam-54734",
                  Camera_name: "Camera4",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-54734",
                  Created_at: "2024-01-05T10:25:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-54734/thumb.jpg"
                },
                {
                  Camera_id: "Cam-54845",
                  Camera_name: "Camera5",
                  Status: "is_active",
                  StreamUrl: "rtsp://mock-stream-server.com:554/live/Cam-54845",
                  Created_at: "2024-04-15T16:50:00.000Z",
                  Updated_at: "2025-08-24T12:00:00.000Z",
                  thumbnailUrl: "https://mock-thumbnails.com/camera/Cam-54845/thumb.jpg"
                }
              ]
            }
          ]
        }
      ],
      playbackSessions: [],
      vehicleData: {
        vehicle: [
          {
            vehicle_type: "pickup_truck",
            vehicle_number: "DL20E4321",
            vehicle_coordinates: [
              {
                latitude: 28.4595,
                longitude: 77.0266
              }
            ],
            route: {
              name: "Gurugram",
              description: "Facilities Endpoints",
              facilities_positions: [
                {
                  "Facility 1": [
                    {
                      latitude: 28.4595,
                      longitude: 77.0266
                    },
                    {
                      latitude: 28.4605,
                      longitude: 77.0276
                    }
                  ]
                },
                {
                  "Facility 2": [
                    {
                      latitude: 28.4615,
                      longitude: 77.0286
                    },
                    {
                      latitude: 28.4625,
                      longitude: 77.0296
                    }
                  ]
                },
                {
                  "Facility 3": [
                    {
                      latitude: 28.4635,
                      longitude: 77.0306
                    },
                    {
                      latitude: 28.4645,
                      longitude: 77.0316
                    }
                  ]
                },
                {
                  "Facility 4": [
                    {
                      latitude: 28.4655,
                      longitude: 77.0326
                    },
                    {
                      latitude: 28.4665,
                      longitude: 77.0336
                    }
                  ]
                },
                {
                  "Facility 5": [
                    {
                      latitude: 28.4675,
                      longitude: 77.0346
                    },
                    {
                      latitude: 28.4595,
                      longitude: 77.0266
                    }
                  ]
                }
              ]
            }
          },
          {
            vehicle_type: "van",
            vehicle_number: "DL12A5678",
            vehicle_coordinates: [
              {
                latitude: 28.7041,
                longitude: 77.1025
              }
            ],
            route: {
              name: "Delhi",
              description: "Facilities Endpoints",
              facilities_positions: [
                {
                  "Facility 1": [
                    {
                      latitude: 28.7041,
                      longitude: 77.1025
                    },
                    {
                      latitude: 28.7051,
                      longitude: 77.1035
                    }
                  ]
                },
                {
                  "Facility 2": [
                    {
                      latitude: 28.7061,
                      longitude: 77.1045
                    },
                    {
                      latitude: 28.7071,
                      longitude: 77.1055
                    }
                  ]
                },
                {
                  "Facility 3": [
                    {
                      latitude: 28.7081,
                      longitude: 77.1065
                    },
                    {
                      latitude: 28.7091,
                      longitude: 77.1075
                    }
                  ]
                },
                {
                  "Facility 4": [
                    {
                      latitude: 28.7101,
                      longitude: 77.1085
                    },
                    {
                      latitude: 28.7111,
                      longitude: 77.1095
                    }
                  ]
                },
                {
                  "Facility 5": [
                    {
                      latitude: 28.7121,
                      longitude: 77.1105
                    },
                    {
                      latitude: 28.7041,
                      longitude: 77.1025
                    }
                  ]
                }
              ]
            }
          },
          {
            vehicle_type: "truck",
            vehicle_number: "MH14C9876",
            vehicle_coordinates: [
              {
                latitude: 19.0760,
                longitude: 72.8777
              }
            ],
            route: {
              name: "Mumbai",
              description: "Facilities Endpoints",
              facilities_positions: [
                {
                  "Facility 1": [
                    {
                      latitude: 19.0760,
                      longitude: 72.8777
                    },
                    {
                      latitude: 19.0770,
                      longitude: 72.8787
                    }
                  ]
                },
                {
                  "Facility 2": [
                    {
                      latitude: 19.0780,
                      longitude: 72.8797
                    },
                    {
                      latitude: 19.0790,
                      longitude: 72.8807
                    }
                  ]
                },
                {
                  "Facility 3": [
                    {
                      latitude: 19.0800,
                      longitude: 72.8817
                    },
                    {
                      latitude: 19.0810,
                      longitude: 72.8827
                    }
                  ]
                },
                {
                  "Facility 4": [
                    {
                      latitude: 19.0820,
                      longitude: 72.8837
                    },
                    {
                      latitude: 19.0830,
                      longitude: 72.8847
                    }
                  ]
                },
                {
                  "Facility 5": [
                    {
                      latitude: 19.0840,
                      longitude: 72.8857
                    },
                    {
                      latitude: 19.0760,
                      longitude: 72.8777
                    }
                  ]
                }
              ]
            }
          },
          {
            vehicle_type: "pickup_truck",
            vehicle_number: "KA05B2468",
            vehicle_coordinates: [
              {
                latitude: 12.9716,
                longitude: 77.5946
              }
            ],
            route: {
              name: "Bangalore",
              description: "Facilities Endpoints",
              facilities_positions: [
                {
                  "Facility 1": [
                    {
                      latitude: 12.9716,
                      longitude: 77.5946
                    },
                    {
                      latitude: 12.9726,
                      longitude: 77.5956
                    }
                  ]
                },
                {
                  "Facility 2": [
                    {
                      latitude: 12.9736,
                      longitude: 77.5966
                    },
                    {
                      latitude: 12.9746,
                      longitude: 77.5976
                    }
                  ]
                },
                {
                  "Facility 3": [
                    {
                      latitude: 12.9756,
                      longitude: 77.5986
                    },
                    {
                      latitude: 12.9766,
                      longitude: 77.5996
                    }
                  ]
                },
                {
                  "Facility 4": [
                    {
                      latitude: 12.9776,
                      longitude: 77.6006
                    },
                    {
                      latitude: 12.9786,
                      longitude: 77.6016
                    }
                  ]
                },
                {
                  "Facility 5": [
                    {
                      latitude: 12.9796,
                      longitude: 77.6026
                    },
                    {
                      latitude: 12.9716,
                      longitude: 77.5946
                    }
                  ]
                }
              ]
            }
          },
          {
            vehicle_type: "van",
            vehicle_number: "MH13F1357",
            vehicle_coordinates: [
              {
                latitude: 18.5204,
                longitude: 73.8567
              }
            ],
            route: {
              name: "Pune",
              description: "Facilities Endpoints",
              facilities_positions: [
                {
                  "Facility 1": [
                    {
                      latitude: 18.5204,
                      longitude: 73.8567
                    },
                    {
                      latitude: 18.5214,
                      longitude: 73.8577
                    }
                  ]
                },
                {
                  "Facility 2": [
                    {
                      latitude: 18.5224,
                      longitude: 73.8587
                    },
                    {
                      latitude: 18.5234,
                      longitude: 73.8597
                    }
                  ]
                },
                {
                  "Facility 3": [
                    {
                      latitude: 18.5244,
                      longitude: 73.8607
                    },
                    {
                      latitude: 18.5254,
                      longitude: 73.8617
                    }
                  ]
                },
                {
                  "Facility 4": [
                    {
                      latitude: 18.5264,
                      longitude: 73.8627
                    },
                    {
                      latitude: 18.5274,
                      longitude: 73.8637
                    }
                  ]
                },
                {
                  "Facility 5": [
                    {
                      latitude: 18.5284,
                      longitude: 73.8647
                    },
                    {
                      latitude: 18.5204,
                      longitude: 73.8567
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
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

  // Helper method to generate mock video segments
  private generateVideoSegments(cameraId: string, date?: string): VideoSegment[] {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const segments: VideoSegment[] = [];
    
    // Generate hourly segments for the day
    for (let hour = 0; hour < 24; hour++) {
      // Skip some hours randomly to simulate missing recordings
      if (Math.random() < 0.05) continue;
      
      const qualities: Array<'720p' | '1080p' | '4K'> = ['720p', '1080p', '4K'];
      const fileSizes = ['245MB', '486MB', '732MB', '1.2GB'];
      
      segments.push({
        id: `${cameraId}_${targetDate}_${hour.toString().padStart(2, '0')}0000`,
        Camera_id: cameraId,
        date: targetDate,
        startTime: `${hour.toString().padStart(2, '0')}:00:00`,
        endTime: `${hour.toString().padStart(2, '0')}:59:59`,
        duration: 60,
        videoUrl: `https://mock-video-storage.com/recordings/${cameraId}/${targetDate}/${hour.toString().padStart(2, '0')}.mp4`,
        thumbnailUrl: `https://mock-thumbnails.com/recordings/${cameraId}/${hour.toString().padStart(2, '0')}.jpg`,
        fileSize: fileSizes[Math.floor(Math.random() * fileSizes.length)],
        quality: qualities[Math.floor(Math.random() * qualities.length)],
        hasAudio: Math.random() > 0.3
      });
    }
    
    return segments;
  }

  // ===== API ENDPOINTS =====

  // Get locations (cities/sectors/cameras) - Updated to read from file
  @Get('locations')
  @ApiOperation({ summary: 'Get cities, sectors, or cameras based on parameters' })
  @ApiQuery({ name: 'city', required: false, type: String, description: 'City name (optional)' })
  @ApiQuery({ name: 'sector', required: false, type: String, description: 'Sector name (optional)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved location data' })
  @HttpCode(HttpStatus.OK)
  async getLocations(
    @Query('city') cityName?: string,
    @Query('sector') sectorName?: string
  ): Promise<ApiResponse<any>> {
    try {
      const data = this.loadFromFile();
      const cities = data.cities;

      // If no parameters provided, return all cities
      if (!cityName && !sectorName) {
        return this.createResponse(true, 'Cities retrieved successfully', cities);
      }
      
      // If only city provided, return sectors for that city
      if (cityName && !sectorName) {
        const city = cities.find(c => c.City === cityName);
        if (!city) {
          throw new NotFoundException(`City '${cityName}' not found`);
        }
        return this.createResponse(true, 'Sectors retrieved successfully', city.Sector);
      }
      
      // If both city and sector provided, return cameras for that city and sector
      if (cityName && sectorName) {
        const city = cities.find(c => c.City === cityName);
        if (!city) {
          throw new NotFoundException(`City '${cityName}' not found`);
        }
        
        const sector = city.Sector.find(s => s.Sector_name === sectorName);
        if (!sector) {
          throw new NotFoundException(`Sector '${sectorName}' not found in city '${cityName}'`);
        }
        
        return this.createResponse(true, 'Cameras retrieved successfully', sector.Camera);
      }
      
      throw new BadRequestException('Invalid parameters');
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new HttpException('Failed to retrieve location data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get video segments (generates mock data, not stored in file)
  @Get('videos')
  @ApiOperation({ summary: 'Get video segments for a camera' })
  @ApiQuery({ name: 'Camera_id', required: true, type: String, description: 'Camera ID' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Date (YYYY-MM-DD, optional)' })
  @ApiQuery({ name: 'startTime', required: false, type: String, description: 'Start time (HH:MM:SS, optional)' })
  @ApiQuery({ name: 'endTime', required: false, type: String, description: 'End time (HH:MM:SS, optional)' })
  @ApiResponse({ status: 200, description: 'Video segments retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getVideos(
    @Query('Camera_id') cameraId: string,
    @Query('date') date?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string
  ): Promise<ApiResponse<VideoSegment[]>> {
    try {
      if (!cameraId) {
        throw new BadRequestException('Camera_id is required');
      }

      // Generate mock video segments
      let segments = this.generateVideoSegments(cameraId, date);
      
      // Filter by time range if provided
      if (startTime || endTime) {
        const start = startTime || '00:00:00';
        const end = endTime || '23:59:59';
        
        segments = segments.filter(segment => 
          segment.startTime >= start && segment.endTime <= end
        );
      }
      
      return this.createResponse(true, 'Video segments retrieved successfully', segments);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new HttpException('Failed to retrieve video segments', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Start playback session - Updated to save to file
  @Post('sessions/start')
  @ApiOperation({ summary: 'Start a playback session for a camera' })
  @ApiBody({
    description: 'Playback session details',
    schema: {
      type: 'object',
      properties: {
        Camera_id: { type: 'string', example: 'Cam-23101', description: 'Camera ID' },
        userId: { type: 'string', example: 'user123', description: 'User ID' },
        date: { type: 'string', example: '2025-08-24', description: 'Date (YYYY-MM-DD, optional)' },
        startTime: { type: 'string', example: '14:00:00', description: 'Start time (HH:MM:SS, optional)' }
      },
      required: ['Camera_id', 'userId']
    }
  })
  @ApiResponse({ status: 201, description: 'Playback session started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Camera not found' })
  @HttpCode(HttpStatus.CREATED)
  async startPlaybackSession(@Body() startPlaybackDto: StartPlaybackDto): Promise<ApiResponse<PlaybackSession>> {
    try {
      const { Camera_id, userId, date, startTime } = startPlaybackDto;

      if (!Camera_id || !userId) {
        throw new BadRequestException('Camera_id and userId are required');
      }

      // Check if camera exists
      const camera = this.findCameraById(Camera_id);
      if (!camera) {
        throw new NotFoundException(`Camera '${Camera_id}' not found`);
      }

      // Check if user already has a session for this camera (resume functionality)
      const existingSession = this.findExistingSession(userId, Camera_id);
      
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: PlaybackSession = {
        id: sessionId,
        Camera_id,
        userId,
        currentTime: existingSession?.currentTime || camera.lastPosition || startTime || '00:00:00',
        currentDate: date || new Date().toISOString().split('T')[0],
        isPlaying: false,
        startedAt: new Date(),
        lastUpdated: new Date(),
        playbackSpeed: 1
      };

      this.playbackSessions.set(sessionId, session);
      
      // Track user sessions (allow multiple sessions per user)
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, []);
      }
      this.userSessions.get(userId)!.push(sessionId);

      // Save to file
      this.saveSessionsToFile();

      return this.createResponse(true, 'Playback session started successfully', session);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new HttpException('Failed to start playback session', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Update playback session - Updated to save to file
  @Put('sessions/:sessionId')
  @ApiOperation({ summary: 'Update playback session position and status' })
  @ApiParam({ name: 'sessionId', type: 'string', description: 'Session ID' })
  @ApiBody({
    description: 'Update playback session data',
    schema: {
      type: 'object',
      properties: {
        currentTime: { type: 'string', example: '14:35:20', description: 'Current playback time (HH:MM:SS)' },
        currentDate: { type: 'string', example: '2025-08-24', description: 'Current date (YYYY-MM-DD)' },
        isPlaying: { type: 'boolean', example: true, description: 'Whether playback is active' },
        playbackSpeed: { type: 'number', example: 1, description: 'Playback speed (1x, 2x, etc.)' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Playback session updated successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @HttpCode(HttpStatus.OK)
  async updatePlaybackSession(
    @Param('sessionId') sessionId: string,
    @Body() updatePlaybackDto: UpdatePlaybackDto
  ): Promise<ApiResponse<PlaybackSession>> {
    try {
      const session = this.playbackSessions.get(sessionId);
      if (!session) {
        throw new NotFoundException(`Session '${sessionId}' not found`);
      }

      // Update session with new data
      const updatedSession = {
        ...session,
        ...updatePlaybackDto,
        lastUpdated: new Date()
      };

      this.playbackSessions.set(sessionId, updatedSession);

      // Update camera's last position if currentTime is provided
      if (updatePlaybackDto.currentTime) {
        const data = this.loadFromFile();
        const camera = this.findCameraByIdInData(session.Camera_id, data);
        if (camera) {
          camera.lastPosition = updatePlaybackDto.currentTime;
          this.saveToFile(data);
        }
      }

      // Save sessions to file
      this.saveSessionsToFile();

      return this.createResponse(true, 'Playback session updated successfully', updatedSession);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException('Failed to update playback session', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get specific playback session
  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get specific playback session details' })
  @ApiParam({ name: 'sessionId', type: 'string', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @HttpCode(HttpStatus.OK)
  async getPlaybackSession(@Param('sessionId') sessionId: string): Promise<ApiResponse<PlaybackSession>> {
    try {
      const session = this.playbackSessions.get(sessionId);
      if (!session) {
        throw new NotFoundException(`Session '${sessionId}' not found`);
      }
      return this.createResponse(true, 'Session retrieved successfully', session);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException('Failed to retrieve session', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get all playback sessions for a user
  @Get('sessions')
  @ApiOperation({ summary: 'Get all playback sessions for a user' })
  @ApiQuery({ name: 'userId', required: true, type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User sessions retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getUserSessions(@Query('userId') userId: string): Promise<ApiResponse<PlaybackSession[]>> {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      const userSessionIds = this.userSessions.get(userId) || [];
      const sessions: PlaybackSession[] = [];

      for (const sessionId of userSessionIds) {
        const session = this.playbackSessions.get(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      return this.createResponse(true, 'User sessions retrieved successfully', sessions);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new HttpException('Failed to retrieve user sessions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete playback session
  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Delete a playback session' })
  @ApiParam({ name: 'sessionId', type: 'string', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @HttpCode(HttpStatus.OK)
  async deletePlaybackSession(@Param('sessionId') sessionId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const session = this.playbackSessions.get(sessionId);
      if (!session) {
        throw new NotFoundException(`Session '${sessionId}' not found`);
      }

      // Remove from memory
      this.playbackSessions.delete(sessionId);

      // Remove from user sessions
      const userSessionIds = this.userSessions.get(session.userId);
      if (userSessionIds) {
        const index = userSessionIds.indexOf(sessionId);
        if (index > -1) {
          userSessionIds.splice(index, 1);
        }
      }

      // Save to file
      this.saveSessionsToFile();

      return this.createResponse(true, 'Session deleted successfully', { 
        message: `Session '${sessionId}' deleted successfully` 
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException('Failed to delete session', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get vehicle tracking data - Updated to read from file
  @Get('vehicles')
  @ApiOperation({ summary: 'Get vehicle tracking data' })
  @ApiResponse({ status: 200, description: 'Vehicle data retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getVehicles(): Promise<ApiResponse<VehicleResponse>> {
    try {
      const data = this.loadFromFile();
      return this.createResponse(true, 'Vehicle data retrieved successfully', data.vehicleData);
    } catch (error) {
      throw new HttpException('Failed to retrieve vehicle data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Update vehicle data - New endpoint to update vehicle positions
  @Put('vehicles')
  @ApiOperation({ summary: 'Update vehicle tracking data' })
  @ApiBody({
    description: 'Vehicle data to update',
    schema: {
      type: 'object',
      properties: {
        vehicle: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vehicle_type: { type: 'string', example: 'pickup_truck' },
              vehicle_number: { type: 'string', example: 'DL20E4321' },
              vehicle_coordinates: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number', example: 28.4595 },
                    longitude: { type: 'number', example: 77.0266 }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Vehicle data updated successfully' })
  @HttpCode(HttpStatus.OK)
  async updateVehicles(@Body() vehicleData: VehicleResponse): Promise<ApiResponse<VehicleResponse>> {
    try {
      const data = this.loadFromFile();
      data.vehicleData = vehicleData;
      this.saveToFile(data);
      
      return this.createResponse(true, 'Vehicle data updated successfully', vehicleData);
    } catch (error) {
      throw new HttpException('Failed to update vehicle data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Health check
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.createResponse(true, 'VMS Playback service is healthy', {
      status: 'OK',
      timestamp: new Date().toISOString()
    });
  }

  // ===== HELPER METHODS =====

  // Helper methods - Updated to work with file data
  private findCameraById(cameraId: string): Camera | null {
    const data = this.loadFromFile();
    return this.findCameraByIdInData(cameraId, data);
  }

  private findCameraByIdInData(cameraId: string, data: VmsData): Camera | null {
    for (const city of data.cities) {
      for (const sector of city.Sector) {
        const camera = sector.Camera.find(cam => cam.Camera_id === cameraId);
        if (camera) return camera;
      }
    }
    return null;
  }

  private findExistingSession(userId: string, cameraId: string): PlaybackSession | null {
    const userSessionIds = this.userSessions.get(userId) || [];
    
    for (const sessionId of userSessionIds) {
      const session = this.playbackSessions.get(sessionId);
      if (session && session.Camera_id === cameraId) {
        return session;
      }
    }
    return null;
  }

  // ===== ENDPOINTS FROM THE SMALLER CONTROLLER =====

  @Get('video-management')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get video management data',
    description: 'Retrieves the complete video management hierarchy with City -> Sector -> Camera -> Video (RTSP) structure including GPS coordinates'
  })
  @ApiResponse({
    status: 200,
    description: 'Video management data retrieved successfully',
    type: VideoManagementResponseDto
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getVideoManagementData(): Promise<VideoManagementResponseDto> {
    // Update timestamps to current time
    this.updateTimestamps();
    return this.mockData;
  }

  private updateTimestamps(): void {
    const currentTime = new Date().toISOString();
    this.mockData.city.sectors.forEach(sector => {
      sector.cameras.forEach(camera => {
        camera.last_update = currentTime;
      });
    });
  }

  @Get('dashboard-overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard overview data',
    description: 'Retrieves key performance indicators for the dashboard'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview data retrieved successfully',
    type: DashboardOverviewDto
  })
  async getDashboardOverview(): Promise<DashboardOverviewDto> {
    return {
      total_waste_collected: 5920,
      vehicles_active: 421,
      vehicles_total: 464,
      workers_on_duty: 1783,
      workers_total: 1920,
      active_alerts: 18,
      response_sla: 10
    };
  }

  @Get('waste-management')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get waste management data',
    description: 'Retrieves zone-wise waste collection data and waste breakdown'
  })
  @ApiResponse({
    status: 200,
    description: 'Waste management data retrieved successfully',
    type: WasteManagementResponseDto
  })
  async getWasteManagementData(): Promise<WasteManagementResponseDto> {
    const zones = ['North', 'South', 'East', 'West', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6', 'Zone 7', 'Zone 8', 'Zone 9'];
    
    const zoneData = zones.map(zone => ({
      zone: zone,
      wet_waste_kg: 11200,
      dry_waste_kg: 5600,
      hazardous_waste_kg: 500,
      total_waste_kg: 17300
    }));
    return {
      zone_data: zoneData
    };
  }

  @Get('alerts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get live alerts',
    description: 'Retrieves real-time alerts from the system'
  })
  @ApiResponse({
    status: 200,
    description: 'Alerts data retrieved successfully',
    type: AlertsResponseDto
  })
  async getAlerts(): Promise<AlertsResponseDto> {
    const alerts = [
      {
        id: 'alert-1',
        vehicle_thumbnail: 'https://example.com/vehicle1.jpg',
        vehicle_id: 'OD02CZ3284',
        speed: '10 km/h',
        event_description: 'Waste collection point 1, Bengaluru',
        source_location: 'Waste collection point 1, Bengaluru',
        destination_location: 'East dumping ground, Bengaluru',
        status: 'active' as const
      },
      {
        id: 'alert-2',
        vehicle_thumbnail: 'https://example.com/vehicle2.jpg',
        vehicle_id: 'OD02CZ3285',
        speed: '15 km/h',
        event_description: 'Waste collection point 2, Bengaluru',
        source_location: 'Waste collection point 2, Bengaluru',
        destination_location: 'West dumping ground, Bengaluru',
        status: 'active' as const
      },
      {
        id: 'alert-3',
        vehicle_thumbnail: 'https://example.com/vehicle3.jpg',
        vehicle_id: 'OD02CZ3286',
        speed: '20 km/h',
        event_description: 'Waste collection point 3, Bengaluru',
        source_location: 'Waste collection point 3, Bengaluru',
        destination_location: 'North dumping ground, Bengaluru',
        status: 'pending' as const
      },
      {
        id: 'alert-4',
        vehicle_thumbnail: 'https://example.com/vehicle4.jpg',
        vehicle_id: 'OD02CZ3287',
        speed: '25 km/h',
        event_description: 'Waste collection point 4, Bengaluru',
        source_location: 'Waste collection point 4, Bengaluru',
        destination_location: 'South dumping ground, Bengaluru',
        status: 'resolved' as const
      }
    ];

    return {
      alerts: alerts,
      total_alerts: alerts.length
    };
  }

  @Get('waste-breakdown')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get waste breakdown chart data',
    description: 'Retrieves waste breakdown data for donut chart visualization'
  })
  @ApiResponse({
    status: 200,
    description: 'Waste breakdown chart data retrieved successfully',
    type: [WasteBreakdownDto]
  })
  async getWasteBreakdown(): Promise<WasteBreakdownDto[]> {
    return [
      { type: 'Wet Waste', percentage: 60 },
      { type: 'Dry Waste', percentage: 40 },
      { type: 'Hazardous Waste', percentage: 20 }
    ];
  }

  @Get('garbage-movement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get garbage movement data',
    description: 'Retrieves garbage movement records from transfer stations'
  })
  @ApiResponse({
    status: 200,
    description: 'Garbage movement data retrieved successfully',
    type: GarbageMovementResponseDto
  })
  async getGarbageMovement(): Promise<GarbageMovementResponseDto> {
    const movements = [
      {
        transfer_station: 'Bandhwari',
        in_date: 'March 24, 2025; 12:00 PM',
        out_date: 'March 24, 2025; 12:00 PM',
        in_weight_kg: 500,
        out_weight_kg: 500,
        net_weight_kg: 0,
        category: 'Wet' as const
      },
      {
        transfer_station: 'Bandhwari',
        in_date: 'March 24, 2025; 01:00 PM',
        out_date: 'March 24, 2025; 01:00 PM',
        in_weight_kg: 750,
        out_weight_kg: 600,
        net_weight_kg: 150,
        category: 'Dry' as const
      },
      {
        transfer_station: 'Bandhwari',
        in_date: 'March 24, 2025; 02:00 PM',
        out_date: 'March 24, 2025; 02:00 PM',
        in_weight_kg: 300,
        out_weight_kg: 300,
        net_weight_kg: 0,
        category: 'Hazardous' as const
      },
      {
        transfer_station: 'Bandhwari',
        in_date: 'March 24, 2025; 03:00 PM',
        out_date: 'March 24, 2025; 03:00 PM',
        in_weight_kg: 600,
        out_weight_kg: 600,
        net_weight_kg: 0,
        category: 'Wet' as const
      },
      {
        transfer_station: 'Bandhwari',
        in_date: 'March 24, 2025; 04:00 PM',
        out_date: 'March 24, 2025; 04:00 PM',
        in_weight_kg: 450,
        out_weight_kg: 400,
        net_weight_kg: 50,
        category: 'Dry' as const
      }
    ];

    return {
      movements: movements,
      total_records: movements.length
    };
  }
}
