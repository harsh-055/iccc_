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
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

// SOS Incidents Interfaces - everything defined inline
export interface SOSIncident {
  id: string;
  title: string;
  type: 'blacklisted_person' | 'weapon_detected' | 'suspicious_activity' | 'unauthorized_access' | 'violence_detected' | 'fire_detected' | 'crowd_detection' | 'loitering' | 'vehicle_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'resolved' | 'false_alarm';
  Camera_id: string;
  Camera_name: string;
  location: {
    city: string;
    sector: string;
    address: string;
    coordinates: {
      lat: number;
      long: number;
    };
  };
  timestamp: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  currentTime?: number;
  description: string;
  confidence: number;
  matchedFaces?: MatchedFace[];
  eventDetails: EventDetails;
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
  alertSent: boolean;
  sopLaunched: boolean;
  sopSteps?: SOPStep[];
}

export interface MatchedFace {
  id: string;
  name: string;
  confidence: number;
  imageUrl: string;
  blacklistReason?: string;
  lastSeen?: string;
}

export interface EventDetails {
  camera: string;
  distanceFromCamera: string;
  skinTone: string;
  location: string;
  source: string;
  nearestCam: string;
  detectionTime: string;
  objectsDetected?: string[];
  peopleCount?: number;
  vehicleDetails?: VehicleDetails;
}

export interface VehicleDetails {
  type: string;
  color: string;
  plateNumber?: string;
  make?: string;
  model?: string;
}

export interface SOPStep {
  stepNumber: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignedTo?: string;
  completedBy?: string;
  completedAt?: string;
  estimatedTime: number;
  actualTime?: number;
  instructions?: string;
  checklistItems?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface IncidentStats {
  total: number;
  active: number;
  resolved: number;
  investigating: number;
  falseAlarms: number;
  byType: { [key: string]: number };
  bySeverity: { [key: string]: number };
  byLocation: { [key: string]: number };
  avgResolutionTime: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

@ApiTags('Alarm SOS')
@Controller('sos/incidents')
export class SOSIncidentsController {
  
  // Path to store the JSON file
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'sos-incidents.json');

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
      this.saveToFile(this.getDefaultIncidents());
    }
  }

  // Load incidents from JSON file
  private loadFromFile(): SOSIncident[] {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error loading incidents from file:', error);
      return this.getDefaultIncidents();
    }
  }

  // Save incidents to JSON file
  private saveToFile(incidents: SOSIncident[]): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(incidents, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving incidents to file:', error);
      throw new HttpException('Failed to save data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get default incidents data
  private getDefaultIncidents(): SOSIncident[] {
    return [
      {
        id: "INC-2024-001",
        title: "Blacklisted Person Detected",
        type: "blacklisted_person",
        severity: "critical",
        status: "active",
        Camera_id: "Cam-11103",
        Camera_name: "Camera 1",
        location: {
          city: "Gurugram",
          sector: "Sector21",
          address: "Smart City Office, Main Gate",
          coordinates: {
            lat: 28.459245,
            long: 77.026834
          }
        },
        timestamp: "2024-12-20T12:00:00.000Z",
        videoUrl: "https://cdn.pixabay.com/video/2023/04/15/158776-821127736_large.mp4",
        thumbnailUrl: "https://cdn.pixabay.com/video/2023/04/15/158776-821127736_large.jpg",
        duration: 120,
        currentTime: 17,
        description: "Blacklisted individual detected near main entrance wearing dark hoodie",
        confidence: 95,
        matchedFaces: [
          {
            id: "FACE-001",
            name: "John Suspect",
            confidence: 95,
            imageUrl: "https://randomuser.me/api/portraits/men/1.jpg",
            blacklistReason: "Previous theft incident",
            lastSeen: "2024-12-15T10:30:00.000Z"
          }
        ],
        eventDetails: {
          camera: "Camera Name 1",
          distanceFromCamera: "50 m",
          skinTone: "Dusky",
          location: "Smart City Office",
          source: "Camera 1",
          nearestCam: "PTZ-501 - Parking Entry",
          detectionTime: "12:00 PM",
          peopleCount: 1
        },
        assignedTo: "Security Team Alpha",
        alertSent: true,
        sopLaunched: true,
        sopSteps: [
          {
            stepNumber: 1,
            title: "Manual Activity",
            description: "Review matched photo, live feed & camera metadata",
            status: "completed",
            assignedTo: "Operator 1",
            completedBy: "Operator 1",
            completedAt: "2024-12-20T12:02:00.000Z",
            estimatedTime: 2,
            actualTime: 2,
            instructions: "View Instructions",
            checklistItems: [
              {
                id: "CHK-001",
                description: "Verify person identity",
                completed: true,
                completedBy: "Operator 1",
                completedAt: "2024-12-20T12:02:00.000Z"
              }
            ]
          },
          {
            stepNumber: 2,
            title: "Automatic Activity",
            description: "Notify the Operator Admin",
            status: "completed",
            estimatedTime: 1,
            actualTime: 1,
            completedAt: "2024-12-20T12:03:00.000Z"
          },
          {
            stepNumber: 3,
            title: "Manual Activity",
            description: "Make announcement in the affected area",
            status: "in_progress",
            assignedTo: "Security Team",
            estimatedTime: 5,
            instructions: "View Instructions"
          }
        ]
      },
      // ... other default incidents would go here (truncated for brevity)
    ];
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

  // Helper method to generate stats
  private generateStats(incidents: SOSIncident[]): IncidentStats {
    const total = incidents.length;
    const active = incidents.filter(inc => inc.status === 'active').length;
    const resolved = incidents.filter(inc => inc.status === 'resolved').length;
    const investigating = incidents.filter(inc => inc.status === 'investigating').length;
    const falseAlarms = incidents.filter(inc => inc.status === 'false_alarm').length;

    const byType: { [key: string]: number } = {};
    incidents.forEach(inc => {
      byType[inc.type] = (byType[inc.type] || 0) + 1;
    });

    const bySeverity: { [key: string]: number } = {};
    incidents.forEach(inc => {
      bySeverity[inc.severity] = (bySeverity[inc.severity] || 0) + 1;
    });

    const byLocation: { [key: string]: number } = {};
    incidents.forEach(inc => {
      const location = `${inc.location.city} - ${inc.location.sector}`;
      byLocation[location] = (byLocation[location] || 0) + 1;
    });

    const resolvedIncidents = incidents.filter(inc => inc.status === 'resolved' && inc.resolvedAt);
    let avgResolutionTime = 0;
    if (resolvedIncidents.length > 0) {
      const totalResolutionTime = resolvedIncidents.reduce((sum, inc) => {
        const created = new Date(inc.timestamp);
        const resolved = new Date(inc.resolvedAt!);
        return sum + (resolved.getTime() - created.getTime());
      }, 0);
      avgResolutionTime = Math.round(totalResolutionTime / resolvedIncidents.length / (1000 * 60));
    }

    return {
      total,
      active,
      resolved,
      investigating,
      falseAlarms,
      byType,
      bySeverity,
      byLocation,
      avgResolutionTime
    };
  }

  // FIXED: Get all incidents with optional filtering or specific incident by ID
  @Get()
  @ApiOperation({ summary: 'Get all SOS incidents with optional filtering or specific incident by ID' })
  @ApiResponse({ status: 200, description: 'Incidents retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  @ApiQuery({ name: 'id', required: false, type: String, description: 'Specific incident ID to retrieve' })
  @ApiQuery({ name: 'city', required: false, type: String, description: 'Filter incidents by city' })
  getIncidents(
    @Query('id') id?: string,
    @Query('city') city?: string
  ): Promise<ApiResponse<SOSIncident | { incidents: SOSIncident[], total: number, stats: IncidentStats }>> {
    try {
      const incidents = this.loadFromFile();

      // If ID is provided, return specific incident
      if (id) {
        const incident = incidents.find(inc => inc.id === id);
        
        if (!incident) {
          throw new HttpException(
            this.createResponse(false, `Incident '${id}' not found`),
            HttpStatus.NOT_FOUND
          );
        }
        return Promise.resolve(this.createResponse(true, 'Incident retrieved successfully', incident));
      }

      // Otherwise, return filtered list of incidents
      let filteredIncidents = incidents;

      if (city) filteredIncidents = filteredIncidents.filter(incident => incident.location.city === city);

      filteredIncidents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const total = filteredIncidents.length;
      const stats = this.generateStats(filteredIncidents);

      return Promise.resolve(this.createResponse(true, 'Incidents retrieved successfully', {
        incidents: filteredIncidents,
        total,
        stats
      }));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to retrieve incidents'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }





  // FIXED: Create new incident (manual reporting)
  @Post()
  @ApiOperation({ summary: 'Create new incident (manual reporting)' })
  @ApiResponse({ status: 201, description: 'Incident created successfully' })
  @ApiBody({
    description: 'New incident data',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        type: { type: 'string' },
        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        Camera_id: { type: 'string' },
        description: { type: 'string' },
        location: { 
          type: 'object',
          properties: {
            city: { type: 'string' },
            sector: { type: 'string' },
            address: { type: 'string' }
          }
        }
      },
      required: ['title', 'type', 'severity', 'Camera_id', 'description']
    }
  })
  createIncident(@Body() incidentData: Partial<SOSIncident>): Promise<ApiResponse<SOSIncident>> {
    try {
      const incidents = this.loadFromFile();

      const newIncident: SOSIncident = {
        id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        title: incidentData.title!,
        type: incidentData.type as any,
        severity: incidentData.severity as any,
        status: 'active',
        Camera_id: incidentData.Camera_id!,
        Camera_name: `Camera ${incidentData.Camera_id}`,
        location: incidentData.location || {
          city: 'Unknown',
          sector: 'Unknown',
          address: 'Unknown',
          coordinates: { lat: 0, long: 0 }
        },
        timestamp: new Date().toISOString(),
        videoUrl: "https://cdn.pixabay.com/video/2023/04/15/158776-821127736_large.mp4",
        thumbnailUrl: "https://cdn.pixabay.com/video/2023/04/15/158776-821127736_large.jpg",
        duration: 60,
        description: incidentData.description!,
        confidence: 75,
        eventDetails: {
          camera: incidentData.Camera_id!,
          distanceFromCamera: "Unknown",
          skinTone: "Unknown",
          location: incidentData.location?.address || "Unknown",
          source: incidentData.Camera_id!,
          nearestCam: "Unknown",
          detectionTime: new Date().toLocaleTimeString()
        },
        alertSent: false,
        sopLaunched: false
      };

      incidents.push(newIncident);
      this.saveToFile(incidents);
      return Promise.resolve(this.createResponse(true, 'Incident created successfully', newIncident));
    } catch (error) {
      throw new HttpException(
        this.createResponse(false, 'Failed to create incident'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }












}