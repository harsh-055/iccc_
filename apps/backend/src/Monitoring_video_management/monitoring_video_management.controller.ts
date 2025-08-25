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

// Interfaces for the larger controller functionality
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
  facilities_positions: Facility;
}

export interface Vehicle {
  vehicle_type: string;
  vehicle_id: string;
  current_position: VehicleCoordinate;
  route: Route;
  status: 'active' | 'inactive' | 'maintenance';
  last_updated: string;
}

export interface VehicleResponse {
  vehicle: Vehicle[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface VmsData {
  cities: City[];
  videoSegments: VideoSegment[];
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
            }
          ]
        }
      ]
    },
    total_cameras: 25,
    total_active_cameras: 23,
    total_inactive_cameras: 2
  };

  // Mock data for the larger controller functionality
  private mockCityData: City = {
    City: 'Gurugram',
    Sector: [
      {
        Sector_name: 'Sector 39',
        lat: '28.4595',
        long: '77.0266',
        Camera: [
          {
            Camera_id: 'CAM001',
            Camera_name: 'Main Gate Camera',
            Status: 'is_active',
            StreamUrl: 'rtsp://192.168.1.100:554/stream1',
            Created_at: '2024-01-01T00:00:00Z',
            Updated_at: '2024-01-01T00:00:00Z',
            lastPosition: 'Main Gate',
            thumbnailUrl: 'https://example.com/thumbnails/cam001.jpg'
          }
        ]
      }
    ]
  };

  private mockVideoSegments: VideoSegment[] = [
    {
      id: 'seg001',
      Camera_id: 'CAM001',
      date: '2024-01-01',
      startTime: '10:00:00',
      endTime: '11:00:00',
      duration: 3600,
      videoUrl: 'https://example.com/videos/seg001.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/seg001.jpg',
      fileSize: '500MB',
      quality: '1080p',
      hasAudio: true
    }
  ];

  private mockPlaybackSessions: PlaybackSession[] = [
    {
      id: 'session001',
      Camera_id: 'CAM001',
      userId: 'user001',
      currentTime: '10:30:00',
      currentDate: '2024-01-01',
      isPlaying: true,
      startedAt: new Date(),
      lastUpdated: new Date(),
      playbackSpeed: 1
    }
  ];

  private mockVehicles: Vehicle[] = [
    {
      vehicle_type: 'Garbage Truck',
      vehicle_id: 'VT001',
      current_position: { latitude: 28.4595, longitude: 77.0266 },
      route: {
        name: 'Route 1',
        description: 'Main collection route',
        facilities_positions: {
          'Transfer Station 1': [{ latitude: 28.4600, longitude: 77.0270 }]
        }
      },
      status: 'active',
      last_updated: '2024-01-01T10:00:00Z'
    }
  ];

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
      }
    ];

    return {
      movements: movements,
      total_records: movements.length
    };
  }

  // ===== ENDPOINTS FROM THE LARGER CONTROLLER =====

  @Get('locations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all camera locations',
    description: 'Retrieves all camera locations with their coordinates and status'
  })
  @ApiResponse({
    status: 200,
    description: 'Camera locations retrieved successfully'
  })
  async getLocations(): Promise<City> {
    return this.mockCityData;
  }

  @Get('videos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get video segments',
    description: 'Retrieves all video segments for playback'
  })
  @ApiQuery({ name: 'cameraId', required: false, description: 'Filter by camera ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Video segments retrieved successfully'
  })
  async getVideos(
    @Query('cameraId') cameraId?: string,
    @Query('date') date?: string
  ): Promise<VideoSegment[]> {
    let filteredSegments = this.mockVideoSegments;
    
    if (cameraId) {
      filteredSegments = filteredSegments.filter(segment => segment.Camera_id === cameraId);
    }
    
    if (date) {
      filteredSegments = filteredSegments.filter(segment => segment.date === date);
    }
    
    return filteredSegments;
  }

  @Post('sessions/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start a playback session',
    description: 'Creates a new playback session for video viewing'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        Camera_id: { type: 'string' },
        userId: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD format' },
        startTime: { type: 'string', description: 'HH:MM:SS format' }
      },
      required: ['Camera_id', 'userId']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Playback session started successfully'
  })
  async startPlaybackSession(@Body() startPlaybackDto: StartPlaybackDto): Promise<PlaybackSession> {
    const session: PlaybackSession = {
      id: `session_${Date.now()}`,
      Camera_id: startPlaybackDto.Camera_id,
      userId: startPlaybackDto.userId,
      currentTime: startPlaybackDto.startTime || '00:00:00',
      currentDate: startPlaybackDto.date || new Date().toISOString().split('T')[0],
      isPlaying: true,
      startedAt: new Date(),
      lastUpdated: new Date(),
      playbackSpeed: 1
    };
    
    this.mockPlaybackSessions.push(session);
    return session;
  }

  @Put('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update playback session',
    description: 'Updates an existing playback session with new parameters'
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID to update' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        currentTime: { type: 'string', description: 'HH:MM:SS format' },
        currentDate: { type: 'string', description: 'YYYY-MM-DD format' },
        isPlaying: { type: 'boolean' },
        playbackSpeed: { type: 'number' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Playback session updated successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found'
  })
  async updatePlaybackSession(
    @Param('sessionId') sessionId: string,
    @Body() updatePlaybackDto: UpdatePlaybackDto
  ): Promise<PlaybackSession> {
    const sessionIndex = this.mockPlaybackSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new NotFoundException('Session not found');
    }
    
    const session = this.mockPlaybackSessions[sessionIndex];
    
    if (updatePlaybackDto.currentTime !== undefined) {
      session.currentTime = updatePlaybackDto.currentTime;
    }
    if (updatePlaybackDto.currentDate !== undefined) {
      session.currentDate = updatePlaybackDto.currentDate;
    }
    if (updatePlaybackDto.isPlaying !== undefined) {
      session.isPlaying = updatePlaybackDto.isPlaying;
    }
    if (updatePlaybackDto.playbackSpeed !== undefined) {
      session.playbackSpeed = updatePlaybackDto.playbackSpeed;
    }
    
    session.lastUpdated = new Date();
    this.mockPlaybackSessions[sessionIndex] = session;
    
    return session;
  }

  @Get('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get playback session',
    description: 'Retrieves a specific playback session by ID'
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID to retrieve' })
  @ApiResponse({
    status: 200,
    description: 'Playback session retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found'
  })
  async getPlaybackSession(@Param('sessionId') sessionId: string): Promise<PlaybackSession> {
    const session = this.mockPlaybackSessions.find(session => session.id === sessionId);
    
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    
    return session;
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all playback sessions',
    description: 'Retrieves all active playback sessions'
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Playback sessions retrieved successfully'
  })
  async getAllPlaybackSessions(@Query('userId') userId?: string): Promise<PlaybackSession[]> {
    let sessions = this.mockPlaybackSessions;
    
    if (userId) {
      sessions = sessions.filter(session => session.userId === userId);
    }
    
    return sessions;
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete playback session',
    description: 'Deletes a specific playback session'
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID to delete' })
  @ApiResponse({
    status: 204,
    description: 'Playback session deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found'
  })
  async deletePlaybackSession(@Param('sessionId') sessionId: string): Promise<void> {
    const sessionIndex = this.mockPlaybackSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new NotFoundException('Session not found');
    }
    
    this.mockPlaybackSessions.splice(sessionIndex, 1);
  }

  @Get('vehicles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all vehicles',
    description: 'Retrieves all vehicles with their current positions and routes'
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicles retrieved successfully'
  })
  async getVehicles(): Promise<Vehicle[]> {
    return this.mockVehicles;
  }

  @Put('vehicles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update vehicle position',
    description: 'Updates the current position of a vehicle'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        vehicle_id: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' }
      },
      required: ['vehicle_id', 'latitude', 'longitude']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicle position updated successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Vehicle not found'
  })
  async updateVehiclePosition(
    @Body() updateData: { vehicle_id: string; latitude: number; longitude: number }
  ): Promise<Vehicle> {
    const vehicleIndex = this.mockVehicles.findIndex(vehicle => vehicle.vehicle_id === updateData.vehicle_id);
    
    if (vehicleIndex === -1) {
      throw new NotFoundException('Vehicle not found');
    }
    
    const vehicle = this.mockVehicles[vehicleIndex];
    vehicle.current_position = {
      latitude: updateData.latitude,
      longitude: updateData.longitude
    };
    vehicle.last_updated = new Date().toISOString();
    
    this.mockVehicles[vehicleIndex] = vehicle;
    return vehicle;
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the video management system'
  })
  @ApiResponse({
    status: 200,
    description: 'System is healthy'
  })
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    version: string;
    uptime: number;
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime()
    };
  }
} 