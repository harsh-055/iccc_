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
export enum MapLayerType {
  ADMINISTRATIVE_BOUNDARY = 'administrative-boundary',
  INTERNATIONAL_BOUNDARY = 'international-boundary',
  STATE_BOUNDARY = 'state-boundary',
  DISTRICT_BOUNDARY = 'district-boundary',
  SUBDISTRICT_BOUNDARY = 'subdistrict-boundary',
  VILLAGE_BOUNDARY = 'village-boundary',
  CITY_ASSETS = 'city-assets',
  CONSTITUENCIES = 'constituencies',
  ROAD_RAILS = 'road-rails',
  DEVICES = 'devices',
  WORKFORCE = 'workforce',
  VEHICLES = 'vehicles'
}

export enum AssetType {
  BANKS = 'banks',
  SCHOOLS = 'schools',
  PRIVATE_SCHOOLS = 'private-schools',
  PUBLIC_SCHOOLS = 'public-schools',
  HEALTH_CENTRE = 'health-centre',
  POST_OFFICE = 'post-office',
  INDUSTRIES = 'industries',
  AIRPORT = 'airport',
  MONUMENTS = 'monuments',
  INTERNET = 'internet',
  MISCELLANEOUS = 'miscellaneous'
}

export enum DeviceType {
  CAMERAS = 'cameras',
  SENSORS = 'sensors',
  DMR_HANDSETS = 'dmr-handsets'
}

export enum VehicleType {
  PICKUP_TRUCK = 'pickup_truck',
  VAN = 'van',
  TRUCK = 'truck',
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  AMBULANCE = 'ambulance',
  FIRE_TRUCK = 'fire_truck',
  POLICE_CAR = 'police_car'
}

export enum IncidentType {
  BLACKLIST_FACE = 'blacklist-face',
  WATERLOGGING = 'waterlogging',
  STREET_LIGHT_FAILURE = 'street-light-failure',
  OVERCROWDING = 'overcrowding',
  FIRE = 'fire',
  ACCIDENT = 'accident',
  TRAFFIC_JAM = 'traffic-jam',
  ILLEGAL_PARKING = 'illegal-parking'
}

// DTOs and Interfaces
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface State {
  id: string;
  name: string;
  code: string;
  coordinates: Coordinates;
  bounds: MapBounds;
  districts: District[];
  created_at: string;
  updated_at: string;
}

export interface District {
  id: string;
  name: string;
  state_id: string;
  coordinates: Coordinates;
  bounds: MapBounds;
  population?: number;
  area_km2?: number;
  created_at: string;
  updated_at: string;
}

export interface CityAsset {
  id: string;
  name: string;
  type: AssetType;
  coordinates: Coordinates;
  address: string;
  district_id?: string;
  state_id?: string;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  device_id: string;
  type: DeviceType;
  name: string;
  coordinates: Coordinates;
  status: 'active' | 'inactive' | 'maintenance';
  district_id?: string;
  state_id?: string;
  specifications?: any;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  type: VehicleType;
  coordinates: Coordinates;
  route_name?: string;
  driver_name?: string;
  status: 'active' | 'inactive' | 'maintenance';
  district_id?: string;
  state_id?: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface MapLayer {
  id: string;
  name: string;
  type: MapLayerType;
  is_visible: boolean;
  is_active: boolean;
  opacity?: number;
  z_index?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomMap {
  id: string;
  name: string;
  description?: string;
  center_coordinates: Coordinates;
  zoom_level: number;
  bounds: MapBounds;
  active_layers: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface LiveIncident {
  id: string;
  type: IncidentType;
  title: string;
  description?: string;
  coordinates: Coordinates;
  camera_id?: string;
  location: string;
  status: 'active' | 'resolved' | 'monitoring';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  updated_at: string;
  thumbnail?: string;
}

export interface PathRoute {
  id: string;
  name: string;
  type: 'regular' | 'patrol' | 'emergency';
  waypoints: Coordinates[];
  distance_km: number;
  estimated_time_mins: number;
  vehicle_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Request DTOs
export interface CreateMapDto {
  name: string;
  description?: string;
  center_coordinates: Coordinates;
  zoom_level?: number;
  bounds?: MapBounds;
  active_layers?: string[];
  is_default?: boolean;
}

export interface UpdateMapDto {
  name?: string;
  description?: string;
  center_coordinates?: Coordinates;
  zoom_level?: number;
  bounds?: MapBounds;
  active_layers?: string[];
  is_default?: boolean;
}

export interface CreateAssetDto {
  name: string;
  type: AssetType;
  coordinates: Coordinates;
  address: string;
  district_id?: string;
  state_id?: string;
  metadata?: any;
}

export interface SearchFilterDto {
  zone?: string;
  sub_zone?: string;
  street?: string;
  landmark?: string;
  coordinates?: Coordinates;
  bounds?: MapBounds;
}

// Response DTOs
export interface MapsData {
  states: State[];
  districts: District[];
  cityAssets: CityAsset[];
  devices: Device[];
  vehicles: Vehicle[];
  mapLayers: MapLayer[];
  customMaps: CustomMap[];
  liveIncidents: LiveIncident[];
  pathRoutes: PathRoute[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

@ApiTags('Maps')
@Controller('maps')
export class MapsController {
  
  // Path to store the JSON file
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'maps-data.json');

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
      this.saveToFile(this.getDefaultMapsData());
    }
  }

  // Load maps data from JSON file
  private loadFromFile(): MapsData {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf8');
        return JSON.parse(data);
      }
      return this.getDefaultMapsData();
    } catch (error) {
      console.error('Error loading maps data from file:', error);
      return this.getDefaultMapsData();
    }
  }

  // Save maps data to JSON file
  private saveToFile(mapsData: MapsData): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(mapsData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving maps data to file:', error);
      throw new HttpException('Failed to save maps data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get default maps data - India focused with correct coordinates
  private getDefaultMapsData(): MapsData {
    const now = new Date().toISOString();
    
    // Generate UUIDs for states and districts
    const delhiStateId = this.generateUUID();
    const haryanaStateId = this.generateUUID();
    const maharashtraStateId = this.generateUUID();
    const karnatakaStateId = this.generateUUID();
    const tamilNaduStateId = this.generateUUID();
    const westBengalStateId = this.generateUUID();
    const gujaratStateId = this.generateUUID();
    const rajasthanStateId = this.generateUUID();
    
    return {
      states: [
        {
          id: delhiStateId,
          name: "Delhi",
          code: "DL",
          coordinates: { latitude: 28.6139, longitude: 77.2090 },
          bounds: { north: 28.8836, south: 28.4044, east: 77.3417, west: 76.8389 },
          districts: [
            {
              id: this.generateUUID(),
              name: "New Delhi",
              state_id: delhiStateId,
              coordinates: { latitude: 28.6139, longitude: 77.2090 },
              bounds: { north: 28.6500, south: 28.5778, east: 77.2500, west: 77.1680 },
              population: 249998,
              area_km2: 42.7,
              created_at: now,
              updated_at: now
            },
            {
              id: this.generateUUID(),
              name: "Central Delhi",
              state_id: delhiStateId,
              coordinates: { latitude: 28.6600, longitude: 77.2300 },
              bounds: { north: 28.6900, south: 28.6300, east: 77.2600, west: 77.2000 },
              population: 582320,
              area_km2: 25.0,
              created_at: now,
              updated_at: now
            },
            {
              id: this.generateUUID(),
              name: "South Delhi",
              state_id: delhiStateId,
              coordinates: { latitude: 28.5244, longitude: 77.2066 },
              bounds: { north: 28.5800, south: 28.4700, east: 77.2800, west: 77.1300 },
              population: 2258367,
              area_km2: 250.0,
              created_at: now,
              updated_at: now
            }
          ],
          created_at: now,
          updated_at: now
        },
        {
          id: haryanaStateId,
          name: "Haryana",
          code: "HR",
          coordinates: { latitude: 29.0588, longitude: 76.0856 },
          bounds: { north: 30.9, south: 27.6, east: 77.6, west: 74.5 },
          districts: [
            {
              id: this.generateUUID(),
              name: "Gurugram",
              state_id: haryanaStateId,
              coordinates: { latitude: 28.4595, longitude: 77.0266 },
              bounds: { north: 28.5500, south: 28.3500, east: 77.1500, west: 76.9000 },
              population: 1514432,
              area_km2: 1253.0,
              created_at: now,
              updated_at: now
            },
            {
              id: this.generateUUID(),
              name: "Faridabad",
              state_id: haryanaStateId,
              coordinates: { latitude: 28.4089, longitude: 77.3178 },
              bounds: { north: 28.5000, south: 28.3000, east: 77.4000, west: 77.2000 },
              population: 1809733,
              area_km2: 2151.0,
              created_at: now,
              updated_at: now
            }
          ],
          created_at: now,
          updated_at: now
        },
        {
          id: maharashtraStateId,
          name: "Maharashtra",
          code: "MH",
          coordinates: { latitude: 19.7515, longitude: 75.7139 },
          bounds: { north: 22.0, south: 15.6, east: 80.9, west: 72.6 },
          districts: [
            {
              id: this.generateUUID(),
              name: "Mumbai",
              state_id: maharashtraStateId,
              coordinates: { latitude: 19.0760, longitude: 72.8777 },
              bounds: { north: 19.2800, south: 18.8900, east: 72.9800, west: 72.7700 },
              population: 12442373,
              area_km2: 603.4,
              created_at: now,
              updated_at: now
            },
            {
              id: this.generateUUID(),
              name: "Pune",
              state_id: maharashtraStateId,
              coordinates: { latitude: 18.5204, longitude: 73.8567 },
              bounds: { north: 18.6500, south: 18.4000, east: 73.9800, west: 73.7300 },
              population: 3124458,
              area_km2: 331.26,
              created_at: now,
              updated_at: now
            },
            {
              id: this.generateUUID(),
              name: "Nagpur",
              state_id: maharashtraStateId,
              coordinates: { latitude: 21.1458, longitude: 79.0882 },
              bounds: { north: 21.2500, south: 21.0500, east: 79.2000, west: 78.9800 },
              population: 2405421,
              area_km2: 217.56,
              created_at: now,
              updated_at: now
            }
          ],
          created_at: now,
          updated_at: now
        },
        {
          id: karnatakaStateId,
          name: "Karnataka",
          code: "KA",
          coordinates: { latitude: 15.3173, longitude: 75.7139 },
          bounds: { north: 18.4, south: 11.3, east: 78.6, west: 74.0 },
          districts: [
            {
              id: this.generateUUID(),
              name: "Bangalore Urban",
              state_id: karnatakaStateId,
              coordinates: { latitude: 12.9716, longitude: 77.5946 },
              bounds: { north: 13.1400, south: 12.8300, east: 77.7800, west: 77.4600 },
              population: 9621551,
              area_km2: 2196.0,
              created_at: now,
              updated_at: now
            },
            {
              id: this.generateUUID(),
              name: "Mysore",
              state_id: karnatakaStateId,
              coordinates: { latitude: 12.2958, longitude: 76.6394 },
              bounds: { north: 12.4000, south: 12.2000, east: 76.7500, west: 76.5500 },
              population: 887446,
              area_km2: 128.42,
              created_at: now,
              updated_at: now
            }
          ],
          created_at: now,
          updated_at: now
        },
        {
          id: tamilNaduStateId,
          name: "Tamil Nadu",
          code: "TN",
          coordinates: { latitude: 11.1271, longitude: 78.6569 },
          bounds: { north: 13.5, south: 8.0, east: 80.3, west: 76.2 },
          districts: [
            {
              id: this.generateUUID(),
              name: "Chennai",
              state_id: tamilNaduStateId,
              coordinates: { latitude: 13.0827, longitude: 80.2707 },
              bounds: { north: 13.2600, south: 12.8300, east: 80.3200, west: 80.1200 },
              population: 4646732,
              area_km2: 426.0,
              created_at: now,
              updated_at: now
            },
            {
              id: this.generateUUID(),
              name: "Coimbatore",
              state_id: tamilNaduStateId,
              coordinates: { latitude: 11.0168, longitude: 76.9558 },
              bounds: { north: 11.1000, south: 10.9300, east: 77.0500, west: 76.8600 },
              population: 1061447,
              area_km2: 246.75,
              created_at: now,
              updated_at: now
            }
          ],
          created_at: now,
          updated_at: now
        },
        {
          id: westBengalStateId,
          name: "West Bengal",
          code: "WB",
          coordinates: { latitude: 22.9868, longitude: 87.8550 },
          bounds: { north: 27.1, south: 21.5, east: 89.9, west: 85.8 },
          districts: [
            {
              id: this.generateUUID(),
              name: "Kolkata",
              state_id: westBengalStateId,
              coordinates: { latitude: 22.5726, longitude: 88.3639 },
              bounds: { north: 22.7000, south: 22.4000, east: 88.5000, west: 88.2000 },
              population: 4496694,
              area_km2: 205.0,
              created_at: now,
              updated_at: now
            }
          ],
          created_at: now,
          updated_at: now
        },
        {
          id: gujaratStateId,
          name: "Gujarat",
          code: "GJ",
          coordinates: { latitude: 22.2587, longitude: 71.1924 },
          bounds: { north: 24.7, south: 20.1, east: 74.5, west: 68.2 },
          districts: [
            {
              id: this.generateUUID(),
              name: "Ahmedabad",
              state_id: gujaratStateId,
              coordinates: { latitude: 23.0225, longitude: 72.5714 },
              bounds: { north: 23.1500, south: 22.9000, east: 72.7000, west: 72.4500 },
              population: 5633927,
              area_km2: 464.0,
              created_at: now,
              updated_at: now
            },
            {
              id: this.generateUUID(),
              name: "Surat",
              state_id: gujaratStateId,
              coordinates: { latitude: 21.1702, longitude: 72.8311 },
              bounds: { north: 21.2800, south: 21.0600, east: 72.9500, west: 72.7100 },
              population: 4467797,
              area_km2: 326.5,
              created_at: now,
              updated_at: now
            }
          ],
          created_at: now,
          updated_at: now
        },
        {
          id: rajasthanStateId,
          name: "Rajasthan",
          code: "RJ",
          coordinates: { latitude: 27.0238, longitude: 74.2179 },
          bounds: { north: 30.2, south: 23.0, east: 78.2, west: 69.5 },
          districts: [
            {
              id: this.generateUUID(),
              name: "Jaipur",
              state_id: rajasthanStateId,
              coordinates: { latitude: 26.9124, longitude: 75.7873 },
              bounds: { north: 27.0500, south: 26.7700, east: 75.9500, west: 75.6200 },
              population: 3073350,
              area_km2: 467.0,
              created_at: now,
              updated_at: now
            }
          ],
          created_at: now,
          updated_at: now
        }
      ],
      districts: [], // Will be populated from states
      cityAssets: [
        // Delhi Assets
        {
          id: this.generateUUID(),
          name: "Red Fort",
          type: AssetType.MONUMENTS,
          coordinates: { latitude: 28.6562, longitude: 77.2410 },
          address: "Netaji Subhash Marg, Lal Qila, Chandni Chowk, New Delhi, Delhi 110006",
          state_id: delhiStateId,
          is_active: true,
          metadata: { heritage_site: true, unesco_world_heritage: true },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "India Gate",
          type: AssetType.MONUMENTS,
          coordinates: { latitude: 28.6129, longitude: 77.2295 },
          address: "Rajpath, India Gate, New Delhi, Delhi 110001",
          state_id: delhiStateId,
          is_active: true,
          metadata: { heritage_site: true, war_memorial: true },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Lotus Temple",
          type: AssetType.MONUMENTS,
          coordinates: { latitude: 28.5535, longitude: 77.2588 },
          address: "Lotus Temple Rd, Bahapur, Shambhu Dayal Bagh, Kalkaji, New Delhi, Delhi 110019",
          state_id: delhiStateId,
          is_active: true,
          metadata: { heritage_site: true, religious_site: true },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "AIIMS Delhi",
          type: AssetType.HEALTH_CENTRE,
          coordinates: { latitude: 28.5672, longitude: 77.2100 },
          address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029",
          state_id: delhiStateId,
          is_active: true,
          metadata: { type: 'hospital', beds: 2698, emergency: true },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Delhi Public School, R.K. Puram",
          type: AssetType.PUBLIC_SCHOOLS,
          coordinates: { latitude: 28.5620, longitude: 77.1762 },
          address: "Kaifi Azmi Marg, Sector 12, R.K. Puram, New Delhi, Delhi 110022",
          state_id: delhiStateId,
          is_active: true,
          metadata: { students: 9500, grades: 'K-12' },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Indira Gandhi International Airport",
          type: AssetType.AIRPORT,
          coordinates: { latitude: 28.5562, longitude: 77.1000 },
          address: "New Delhi, Delhi 110037",
          state_id: delhiStateId,
          is_active: true,
          metadata: { iata_code: 'DEL', terminals: 3, international: true },
          created_at: now,
          updated_at: now
        },
        // Mumbai Assets
        {
          id: this.generateUUID(),
          name: "Gateway of India",
          type: AssetType.MONUMENTS,
          coordinates: { latitude: 18.9220, longitude: 72.8347 },
          address: "Apollo Bandar, Colaba, Mumbai, Maharashtra 400001",
          state_id: maharashtraStateId,
          is_active: true,
          metadata: { heritage_site: true, year_built: 1924 },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Chhatrapati Shivaji Maharaj Terminus",
          type: AssetType.MONUMENTS,
          coordinates: { latitude: 18.9398, longitude: 72.8355 },
          address: "Fort, Mumbai, Maharashtra 400001",
          state_id: maharashtraStateId,
          is_active: true,
          metadata: { heritage_site: true, unesco_world_heritage: true, railway_station: true },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Reserve Bank of India - Mumbai",
          type: AssetType.BANKS,
          coordinates: { latitude: 18.9322, longitude: 72.8358 },
          address: "Shahid Bhagat Singh Marg, Fort, Mumbai, Maharashtra 400001",
          state_id: maharashtraStateId,
          is_active: true,
          metadata: { type: 'central_bank', headquarters: true },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Mumbai International Airport",
          type: AssetType.AIRPORT,
          coordinates: { latitude: 19.0896, longitude: 72.8656 },
          address: "Chhatrapati Shivaji International Airport, Mumbai, Maharashtra 400099",
          state_id: maharashtraStateId,
          is_active: true,
          metadata: { iata_code: 'BOM', terminals: 2, international: true },
          created_at: now,
          updated_at: now
        },
        // Bangalore Assets
        {
          id: this.generateUUID(),
          name: "Bangalore Palace",
          type: AssetType.MONUMENTS,
          coordinates: { latitude: 12.9984, longitude: 77.5926 },
          address: "Vasanth Nagar, Bengaluru, Karnataka 560052",
          state_id: karnatakaStateId,
          is_active: true,
          metadata: { heritage_site: true, year_built: 1878 },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Lalbagh Botanical Garden",
          type: AssetType.MISCELLANEOUS,
          coordinates: { latitude: 12.9507, longitude: 77.5848 },
          address: "Mavalli, Bengaluru, Karnataka 560004",
          state_id: karnatakaStateId,
          is_active: true,
          metadata: { type: 'botanical_garden', area_acres: 240 },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "IISC Bangalore",
          type: AssetType.SCHOOLS,
          coordinates: { latitude: 13.0219, longitude: 77.5671 },
          address: "CV Raman Rd, Bengaluru, Karnataka 560012",
          state_id: karnatakaStateId,
          is_active: true,
          metadata: { type: 'university', research_institute: true },
          created_at: now,
          updated_at: now
        },
        // Chennai Assets
        {
          id: this.generateUUID(),
          name: "Marina Beach",
          type: AssetType.MISCELLANEOUS,
          coordinates: { latitude: 13.0500, longitude: 80.2824 },
          address: "Marina Beach, Chennai, Tamil Nadu",
          state_id: tamilNaduStateId,
          is_active: true,
          metadata: { beach: true, length_km: 13, tourist_spot: true },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Fort St. George",
          type: AssetType.MONUMENTS,
          coordinates: { latitude: 13.0796, longitude: 80.2875 },
          address: "Rajaji Salai, Near Secretariat, Chennai, Tamil Nadu 600001",
          state_id: tamilNaduStateId,
          is_active: true,
          metadata: { heritage_site: true, year_built: 1644 },
          created_at: now,
          updated_at: now
        },
        // Kolkata Assets
        {
          id: this.generateUUID(),
          name: "Victoria Memorial",
          type: AssetType.MONUMENTS,
          coordinates: { latitude: 22.5448, longitude: 88.3426 },
          address: "1, Queens Way, Maidan, Kolkata, West Bengal 700071",
          state_id: westBengalStateId,
          is_active: true,
          metadata: { heritage_site: true, museum: true },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Howrah Bridge",
          type: AssetType.MISCELLANEOUS,
          coordinates: { latitude: 22.5851, longitude: 88.3468 },
          address: "Hooghly River, Kolkata, West Bengal 700001",
          state_id: westBengalStateId,
          is_active: true,
          metadata: { bridge: true, heritage_site: true },
          created_at: now,
          updated_at: now
        },
        // Gurugram Assets
        {
          id: this.generateUUID(),
          name: "Cyber Hub",
          type: AssetType.MISCELLANEOUS,
          coordinates: { latitude: 28.4942, longitude: 77.0885 },
          address: "DLF Cyber City, Gurugram, Haryana 122002",
          state_id: haryanaStateId,
          is_active: true,
          metadata: { type: 'commercial_hub', restaurants: true, entertainment: true },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Kingdom of Dreams",
          type: AssetType.MISCELLANEOUS,
          coordinates: { latitude: 28.4677, longitude: 77.0693 },
          address: "Auditorium Complex, Sector 29, Gurugram, Haryana 122002",
          state_id: haryanaStateId,
          is_active: true,
          metadata: { type: 'entertainment_venue', theater: true },
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Medanta Hospital",
          type: AssetType.HEALTH_CENTRE,
          coordinates: { latitude: 28.4389, longitude: 77.0412 },
          address: "CH Baktawar Singh Road, Sector 38, Gurugram, Haryana 122001",
          state_id: haryanaStateId,
          is_active: true,
          metadata: { type: 'hospital', beds: 1250, emergency: true },
          created_at: now,
          updated_at: now
        }
      ],
      devices: [
        // Delhi Cameras
        {
          id: this.generateUUID(),
          device_id: "CAM-DL-001",
          type: DeviceType.CAMERAS,
          name: "Red Fort Main Gate Camera",
          coordinates: { latitude: 28.6562, longitude: 77.2410 },
          status: 'active',
          state_id: delhiStateId,
          specifications: { resolution: '4K', night_vision: true, ai_enabled: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "CAM-DL-002",
          type: DeviceType.CAMERAS,
          name: "India Gate Circle Camera",
          coordinates: { latitude: 28.6129, longitude: 77.2295 },
          status: 'active',
          state_id: delhiStateId,
          specifications: { resolution: '4K', night_vision: true, ptz: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "CAM-DL-003",
          type: DeviceType.CAMERAS,
          name: "Connaught Place Camera",
          coordinates: { latitude: 28.6304, longitude: 77.2177 },
          status: 'active',
          state_id: delhiStateId,
          specifications: { resolution: '1080p', night_vision: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "CAM-DL-004",
          type: DeviceType.CAMERAS,
          name: "Rajpath Camera",
          coordinates: { latitude: 28.6143, longitude: 77.2190 },
          status: 'active',
          state_id: delhiStateId,
          specifications: { resolution: '4K', night_vision: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        // Mumbai Cameras
        {
          id: this.generateUUID(),
          device_id: "CAM-MH-001",
          type: DeviceType.CAMERAS,
          name: "Gateway of India Camera",
          coordinates: { latitude: 18.9220, longitude: 72.8347 },
          status: 'active',
          state_id: maharashtraStateId,
          specifications: { resolution: '4K', night_vision: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "CAM-MH-002",
          type: DeviceType.CAMERAS,
          name: "Marine Drive Camera",
          coordinates: { latitude: 18.9432, longitude: 72.8235 },
          status: 'active',
          state_id: maharashtraStateId,
          specifications: { resolution: '1080p', night_vision: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "CAM-MH-003",
          type: DeviceType.CAMERAS,
          name: "CST Station Camera",
          coordinates: { latitude: 18.9398, longitude: 72.8355 },
          status: 'active',
          state_id: maharashtraStateId,
          specifications: { resolution: '4K', night_vision: true, ai_enabled: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        // Bangalore Cameras
        {
          id: this.generateUUID(),
          device_id: "CAM-KA-001",
          type: DeviceType.CAMERAS,
          name: "MG Road Camera",
          coordinates: { latitude: 12.9716, longitude: 77.6195 },
          status: 'active',
          state_id: karnatakaStateId,
          specifications: { resolution: '4K', night_vision: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "CAM-KA-002",
          type: DeviceType.CAMERAS,
          name: "Brigade Road Camera",
          coordinates: { latitude: 12.9719, longitude: 77.6065 },
          status: 'active',
          state_id: karnatakaStateId,
          specifications: { resolution: '1080p', night_vision: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        // Gurugram Cameras
        {
          id: this.generateUUID(),
          device_id: "CAM-HR-001",
          type: DeviceType.CAMERAS,
          name: "Cyber Hub Main Camera",
          coordinates: { latitude: 28.4942, longitude: 77.0885 },
          status: 'active',
          state_id: haryanaStateId,
          specifications: { resolution: '4K', night_vision: true, ai_enabled: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "CAM-HR-002",
          type: DeviceType.CAMERAS,
          name: "Golf Course Road Camera",
          coordinates: { latitude: 28.4716, longitude: 77.0833 },
          status: 'active',
          state_id: haryanaStateId,
          specifications: { resolution: '4K', night_vision: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "CAM-HR-003",
          type: DeviceType.CAMERAS,
          name: "MG Road Metro Station Camera",
          coordinates: { latitude: 28.4792, longitude: 77.0798 },
          status: 'active',
          state_id: haryanaStateId,
          specifications: { resolution: '1080p', night_vision: true },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        // Sensors
        {
          id: this.generateUUID(),
          device_id: "SENS-DL-001",
          type: DeviceType.SENSORS,
          name: "Air Quality Sensor - Connaught Place",
          coordinates: { latitude: 28.6315, longitude: 77.2167 },
          status: 'active',
          state_id: delhiStateId,
          specifications: { type: 'air_quality', parameters: ['PM2.5', 'PM10', 'CO2', 'NO2'] },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "SENS-DL-002",
          type: DeviceType.SENSORS,
          name: "Air Quality Sensor - Anand Vihar",
          coordinates: { latitude: 28.6472, longitude: 77.3160 },
          status: 'active',
          state_id: delhiStateId,
          specifications: { type: 'air_quality', parameters: ['PM2.5', 'PM10', 'CO2', 'NO2'] },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "SENS-HR-001",
          type: DeviceType.SENSORS,
          name: "Traffic Sensor - NH8",
          coordinates: { latitude: 28.4590, longitude: 77.0726 },
          status: 'active',
          state_id: haryanaStateId,
          specifications: { type: 'traffic', parameters: ['vehicle_count', 'speed', 'congestion'] },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "SENS-MH-001",
          type: DeviceType.SENSORS,
          name: "Flood Sensor - Dadar",
          coordinates: { latitude: 19.0178, longitude: 72.8478 },
          status: 'active',
          state_id: maharashtraStateId,
          specifications: { type: 'water_level', parameters: ['level', 'flow_rate'] },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        // DMR Handsets
        {
          id: this.generateUUID(),
          device_id: "DMR-DL-001",
          type: DeviceType.DMR_HANDSETS,
          name: "Police Unit Alpha-1",
          coordinates: { latitude: 28.6139, longitude: 77.2090 },
          status: 'active',
          state_id: delhiStateId,
          specifications: { model: 'Motorola DP4801e', range_km: 8 },
          last_seen: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          device_id: "DMR-HR-001",
          type: DeviceType.DMR_HANDSETS,
          name: "Traffic Police Unit T-5",
          coordinates: { latitude: 28.4595, longitude: 77.0266 },
          status: 'active',
          state_id: haryanaStateId,
          specifications: { model: 'Hytera PD985', range_km: 10 },
          last_seen: now,
          created_at: now,
          updated_at: now
        }
      ],
      vehicles: [
        // Delhi Vehicles
        {
          id: this.generateUUID(),
          vehicle_number: "DL-01-AB-1234",
          type: VehicleType.POLICE_CAR,
          coordinates: { latitude: 28.6129, longitude: 77.2295 },
          route_name: "India Gate Patrol",
          driver_name: "Inspector Raj Kumar",
          status: 'active',
          state_id: delhiStateId,
          last_updated: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          vehicle_number: "DL-03-CD-5678",
          type: VehicleType.AMBULANCE,
          coordinates: { latitude: 28.5672, longitude: 77.2100 },
          route_name: "AIIMS Emergency Route",
          driver_name: "Suresh Sharma",
          status: 'active',
          state_id: delhiStateId,
          last_updated: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          vehicle_number: "DL-05-EF-9012",
          type: VehicleType.FIRE_TRUCK,
          coordinates: { latitude: 28.6304, longitude: 77.2177 },
          route_name: "Central Delhi Fire Service",
          driver_name: "Ramesh Yadav",
          status: 'active',
          state_id: delhiStateId,
          last_updated: now,
          created_at: now,
          updated_at: now
        },
        // Gurugram Vehicles
        {
          id: this.generateUUID(),
          vehicle_number: "HR-26-AA-3456",
          type: VehicleType.POLICE_CAR,
          coordinates: { latitude: 28.4595, longitude: 77.0266 },
          route_name: "Cyber City Patrol",
          driver_name: "SI Anil Kumar",
          status: 'active',
          state_id: haryanaStateId,
          last_updated: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          vehicle_number: "HR-26-BB-7890",
          type: VehicleType.PICKUP_TRUCK,
          coordinates: { latitude: 28.4716, longitude: 77.0833 },
          route_name: "Golf Course Road Maintenance",
          driver_name: "Vijay Singh",
          status: 'active',
          state_id: haryanaStateId,
          last_updated: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          vehicle_number: "HR-26-CC-2345",
          type: VehicleType.VAN,
          coordinates: { latitude: 28.4942, longitude: 77.0885 },
          route_name: "DLF Phase 2 Route",
          driver_name: "Mukesh Kumar",
          status: 'active',
          state_id: haryanaStateId,
          last_updated: now,
          created_at: now,
          updated_at: now
        },
        // Mumbai Vehicles
        {
          id: this.generateUUID(),
          vehicle_number: "MH-01-AB-4567",
          type: VehicleType.POLICE_CAR,
          coordinates: { latitude: 18.9220, longitude: 72.8347 },
          route_name: "Gateway Patrol",
          driver_name: "Constable Patil",
          status: 'active',
          state_id: maharashtraStateId,
          last_updated: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          vehicle_number: "MH-02-CD-8901",
          type: VehicleType.AMBULANCE,
          coordinates: { latitude: 18.9432, longitude: 72.8235 },
          route_name: "Marine Drive Emergency",
          driver_name: "Sachin Deshmukh",
          status: 'active',
          state_id: maharashtraStateId,
          last_updated: now,
          created_at: now,
          updated_at: now
        },
        // Bangalore Vehicles
        {
          id: this.generateUUID(),
          vehicle_number: "KA-01-EF-2345",
          type: VehicleType.POLICE_CAR,
          coordinates: { latitude: 12.9716, longitude: 77.5946 },
          route_name: "MG Road Patrol",
          driver_name: "SI Reddy",
          status: 'active',
          state_id: karnatakaStateId,
          last_updated: now,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          vehicle_number: "KA-03-GH-6789",
          type: VehicleType.TRUCK,
          coordinates: { latitude: 12.9507, longitude: 77.5848 },
          route_name: "Lalbagh Maintenance",
          driver_name: "Krishna Murthy",
          status: 'active',
          state_id: karnatakaStateId,
          last_updated: now,
          created_at: now,
          updated_at: now
        }
      ],
      mapLayers: [
        {
          id: this.generateUUID(),
          name: "Administrative Boundary",
          type: MapLayerType.ADMINISTRATIVE_BOUNDARY,
          is_visible: true,
          is_active: true,
          opacity: 0.8,
          z_index: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "State Boundary",
          type: MapLayerType.STATE_BOUNDARY,
          is_visible: true,
          is_active: true,
          opacity: 0.7,
          z_index: 2,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "District Boundary",
          type: MapLayerType.DISTRICT_BOUNDARY,
          is_visible: false,
          is_active: true,
          opacity: 0.6,
          z_index: 3,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "City Assets",
          type: MapLayerType.CITY_ASSETS,
          is_visible: true,
          is_active: true,
          opacity: 1.0,
          z_index: 10,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Cameras",
          type: MapLayerType.DEVICES,
          is_visible: true,
          is_active: true,
          opacity: 1.0,
          z_index: 11,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Vehicles",
          type: MapLayerType.VEHICLES,
          is_visible: true,
          is_active: true,
          opacity: 1.0,
          z_index: 12,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Roads & Rails",
          type: MapLayerType.ROAD_RAILS,
          is_visible: false,
          is_active: true,
          opacity: 0.9,
          z_index: 4,
          created_at: now,
          updated_at: now
        }
      ],
      customMaps: [
        {
          id: this.generateUUID(),
          name: "Default India Map",
          description: "Default view of India with major cities",
          center_coordinates: { latitude: 20.5937, longitude: 78.9629 },
          zoom_level: 5,
          bounds: { north: 37.0, south: 8.0, east: 97.0, west: 68.0 },
          active_layers: [MapLayerType.ADMINISTRATIVE_BOUNDARY, MapLayerType.STATE_BOUNDARY],
          is_default: true,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Delhi NCR View",
          description: "Detailed view of Delhi NCR region",
          center_coordinates: { latitude: 28.6139, longitude: 77.2090 },
          zoom_level: 10,
          bounds: { north: 28.8836, south: 28.3044, east: 77.4417, west: 76.8389 },
          active_layers: [MapLayerType.DEVICES, MapLayerType.VEHICLES, MapLayerType.CITY_ASSETS],
          is_default: false,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Gurugram Smart City",
          description: "Gurugram city surveillance and monitoring",
          center_coordinates: { latitude: 28.4595, longitude: 77.0266 },
          zoom_level: 12,
          bounds: { north: 28.5500, south: 28.3500, east: 77.1500, west: 76.9000 },
          active_layers: [MapLayerType.DEVICES, MapLayerType.VEHICLES, MapLayerType.CITY_ASSETS, MapLayerType.DISTRICT_BOUNDARY],
          is_default: false,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Mumbai Metropolitan",
          description: "Mumbai city and suburban monitoring",
          center_coordinates: { latitude: 19.0760, longitude: 72.8777 },
          zoom_level: 11,
          bounds: { north: 19.2800, south: 18.8900, east: 73.0800, west: 72.7700 },
          active_layers: [MapLayerType.DEVICES, MapLayerType.VEHICLES, MapLayerType.CITY_ASSETS],
          is_default: false,
          created_at: now,
          updated_at: now
        }
      ],
      liveIncidents: [
        {
          id: this.generateUUID(),
          type: IncidentType.BLACKLIST_FACE,
          title: "Blacklist Face Detected",
          description: "Suspicious person detected at Parking Lot, Majestic Metro Station",
          coordinates: { latitude: 28.6562, longitude: 77.2410 },
          camera_id: "CAM-DL-001",
          location: "Red Fort, Delhi",
          status: 'active',
          severity: 'high',
          detected_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
          updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          thumbnail: "https://example.com/incident1.jpg"
        },
        {
          id: this.generateUUID(),
          type: IncidentType.WATERLOGGING,
          title: "Waterlogging Reported",
          description: "Heavy waterlogging detected at underpass",
          coordinates: { latitude: 28.4792, longitude: 77.0798 },
          camera_id: "CAM-HR-003",
          location: "MG Road Metro Station, Gurugram",
          status: 'active',
          severity: 'medium',
          detected_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
          updated_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
          thumbnail: "https://example.com/incident2.jpg"
        },
        {
          id: this.generateUUID(),
          type: IncidentType.STREET_LIGHT_FAILURE,
          title: "Street Light Failure",
          description: "Multiple street lights not working",
          coordinates: { latitude: 18.9432, longitude: 72.8235 },
          camera_id: "CAM-MH-002",
          location: "Marine Drive, Mumbai",
          status: 'monitoring',
          severity: 'low',
          detected_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
          updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: this.generateUUID(),
          type: IncidentType.OVERCROWDING,
          title: "Overcrowding Alert",
          description: "Heavy crowd detected at metro station",
          coordinates: { latitude: 28.6304, longitude: 77.2177 },
          camera_id: "CAM-DL-003",
          location: "Connaught Place, Delhi",
          status: 'active',
          severity: 'high',
          detected_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 1).toISOString()
        },
        {
          id: this.generateUUID(),
          type: IncidentType.TRAFFIC_JAM,
          title: "Heavy Traffic Congestion",
          description: "Severe traffic jam on NH8",
          coordinates: { latitude: 28.4590, longitude: 77.0726 },
          location: "NH8 Highway, Gurugram",
          status: 'active',
          severity: 'critical',
          detected_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          updated_at: now
        },
        {
          id: this.generateUUID(),
          type: IncidentType.ILLEGAL_PARKING,
          title: "Illegal Parking Detected",
          description: "Vehicle parked in no-parking zone",
          coordinates: { latitude: 12.9716, longitude: 77.6195 },
          camera_id: "CAM-KA-001",
          location: "MG Road, Bangalore",
          status: 'resolved',
          severity: 'low',
          detected_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 20).toISOString()
        }
      ],
      pathRoutes: [
        {
          id: this.generateUUID(),
          name: "NH 48 Route",
          type: 'regular',
          waypoints: [
            { latitude: 28.4595, longitude: 77.0266 },
            { latitude: 28.4816, longitude: 77.1033 },
            { latitude: 28.5039, longitude: 77.0802 },
            { latitude: 28.4595, longitude: 77.0266 }
          ],
          distance_km: 23,
          estimated_time_mins: 28,
          vehicle_id: "HR-26-AA-3456",
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "Rani Avantibai Road",
          type: 'patrol',
          waypoints: [
            { latitude: 28.4837, longitude: 77.1033 },
            { latitude: 28.4923, longitude: 77.0928 },
            { latitude: 28.5039, longitude: 77.0802 },
            { latitude: 28.4837, longitude: 77.1033 }
          ],
          distance_km: 16,
          estimated_time_mins: 18,
          vehicle_id: "HR-26-BB-7890",
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          id: this.generateUUID(),
          name: "NH 148A",
          type: 'emergency',
          waypoints: [
            { latitude: 28.5039, longitude: 77.0802 },
            { latitude: 28.5278, longitude: 77.0980 },
            { latitude: 28.5499, longitude: 77.0726 },
            { latitude: 28.5039, longitude: 77.0802 }
          ],
          distance_km: 30,
          estimated_time_mins: 24,
          is_active: true,
          created_at: now,
          updated_at: now
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

  // ===== API ENDPOINTS =====



  // Get city assets
  @Get('assets')
  @ApiOperation({ summary: 'Get city assets' })
  @ApiQuery({ name: 'type', required: false, enum: AssetType, description: 'Filter by asset type' })
  @ApiQuery({ name: 'state_id', required: false, type: String, description: 'Filter by state ID' })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getAssets(
    @Query('type') type?: AssetType,
    @Query('state_id') stateId?: string
  ): Promise<ApiResponse<CityAsset[]>> {
    try {
      const data = this.loadFromFile();
      let assets = data.cityAssets.filter(asset => asset.is_active);
      
      if (type) {
        assets = assets.filter(asset => asset.type === type);
      }
      
      if (stateId) {
        assets = assets.filter(asset => asset.state_id === stateId);
      }
      
      return this.createResponse(true, 'Assets retrieved successfully', assets);
    } catch (error) {
      throw new HttpException('Failed to retrieve assets', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get devices
  @Get('devices')
  @ApiOperation({ summary: 'Get devices (cameras, sensors, etc.)' })
  @ApiQuery({ name: 'type', required: false, enum: DeviceType, description: 'Filter by device type' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'maintenance'], description: 'Filter by status' })
  @ApiQuery({ name: 'state_id', required: false, type: String, description: 'Filter by state ID' })
  @ApiResponse({ status: 200, description: 'Devices retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getDevices(
    @Query('type') type?: DeviceType,
    @Query('status') status?: string,
    @Query('state_id') stateId?: string
  ): Promise<ApiResponse<Device[]>> {
    try {
      const data = this.loadFromFile();
      let devices = [...data.devices];
      
      if (type) {
        devices = devices.filter(device => device.type === type);
      }
      
      if (status) {
        devices = devices.filter(device => device.status === status);
      }
      
      if (stateId) {
        devices = devices.filter(device => device.state_id === stateId);
      }
      
      return this.createResponse(true, 'Devices retrieved successfully', devices);
    } catch (error) {
      throw new HttpException('Failed to retrieve devices', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get vehicles
  @Get('vehicles')
  @ApiOperation({ summary: 'Get vehicles' })
  @ApiQuery({ name: 'type', required: false, enum: VehicleType, description: 'Filter by vehicle type' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'maintenance'], description: 'Filter by status' })
  @ApiQuery({ name: 'state_id', required: false, type: String, description: 'Filter by state ID' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getVehicles(
    @Query('type') type?: VehicleType,
    @Query('status') status?: string,
    @Query('state_id') stateId?: string
  ): Promise<ApiResponse<Vehicle[]>> {
    try {
      const data = this.loadFromFile();
      let vehicles = [...data.vehicles];
      
      if (type) {
        vehicles = vehicles.filter(vehicle => vehicle.type === type);
      }
      
      if (status) {
        vehicles = vehicles.filter(vehicle => vehicle.status === status);
      }
      
      if (stateId) {
        vehicles = vehicles.filter(vehicle => vehicle.state_id === stateId);
      }
      
      return this.createResponse(true, 'Vehicles retrieved successfully', vehicles);
    } catch (error) {
      throw new HttpException('Failed to retrieve vehicles', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get map layers
  @Get('layers')
  @ApiOperation({ summary: 'Get map layers' })
  @ApiQuery({ name: 'type', required: false, enum: MapLayerType, description: 'Filter by layer type' })
  @ApiQuery({ name: 'is_visible', required: false, type: Boolean, description: 'Filter by visibility' })
  @ApiResponse({ status: 200, description: 'Map layers retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getMapLayers(
    @Query('type') type?: MapLayerType,
    @Query('is_visible') isVisible?: boolean
  ): Promise<ApiResponse<MapLayer[]>> {
    try {
      const data = this.loadFromFile();
      let layers = data.mapLayers.filter(layer => layer.is_active);
      
      if (type) {
        layers = layers.filter(layer => layer.type === type);
      }
      
      if (isVisible !== undefined) {
        layers = layers.filter(layer => layer.is_visible === isVisible);
      }
      
      return this.createResponse(true, 'Map layers retrieved successfully', layers);
    } catch (error) {
      throw new HttpException('Failed to retrieve map layers', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get custom maps
  @Get('custom-maps')
  @ApiOperation({ summary: 'Get custom maps' })
  @ApiResponse({ status: 200, description: 'Custom maps retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getCustomMaps(): Promise<ApiResponse<CustomMap[]>> {
    try {
      const data = this.loadFromFile();
      return this.createResponse(true, 'Custom maps retrieved successfully', data.customMaps);
    } catch (error) {
      throw new HttpException('Failed to retrieve custom maps', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get live incidents
  @Get('live-incidents')
  @ApiOperation({ summary: 'Get live incidents' })
  @ApiQuery({ name: 'type', required: false, enum: IncidentType, description: 'Filter by incident type' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'resolved', 'monitoring'], description: 'Filter by status' })
  @ApiQuery({ name: 'severity', required: false, enum: ['low', 'medium', 'high', 'critical'], description: 'Filter by severity' })
  @ApiResponse({ status: 200, description: 'Live incidents retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getLiveIncidents(
    @Query('type') type?: IncidentType,
    @Query('status') status?: string,
    @Query('severity') severity?: string
  ): Promise<ApiResponse<LiveIncident[]>> {
    try {
      const data = this.loadFromFile();
      let incidents = [...data.liveIncidents];
      
      if (type) {
        incidents = incidents.filter(incident => incident.type === type);
      }
      
      if (status) {
        incidents = incidents.filter(incident => incident.status === status);
      }
      
      if (severity) {
        incidents = incidents.filter(incident => incident.severity === severity);
      }
      
      return this.createResponse(true, 'Live incidents retrieved successfully', incidents);
    } catch (error) {
      throw new HttpException('Failed to retrieve live incidents', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get path routes
  @Get('routes')
  @ApiOperation({ summary: 'Get path routes' })
  @ApiQuery({ name: 'type', required: false, enum: ['regular', 'patrol', 'emergency'], description: 'Filter by route type' })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Path routes retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getPathRoutes(
    @Query('type') type?: string,
    @Query('is_active') isActive?: boolean
  ): Promise<ApiResponse<PathRoute[]>> {
    try {
      const data = this.loadFromFile();
      let routes = [...data.pathRoutes];
      
      if (type) {
        routes = routes.filter(route => route.type === type);
      }
      
      if (isActive !== undefined) {
        routes = routes.filter(route => route.is_active === isActive);
      }
      
      return this.createResponse(true, 'Path routes retrieved successfully', routes);
    } catch (error) {
      throw new HttpException('Failed to retrieve path routes', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  // Create custom map
  @Post('custom-maps')
  @ApiOperation({ summary: 'Create a custom map' })
  @ApiBody({
    description: 'Custom map data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'My Custom Map' },
        description: { type: 'string', example: 'Custom view for monitoring' },
        center_coordinates: {
          type: 'object',
          properties: {
            latitude: { type: 'number', example: 28.7041 },
            longitude: { type: 'number', example: 77.1025 }
          }
        },
        zoom_level: { type: 'number', example: 10 },
        active_layers: { type: 'array', items: { type: 'string' } }
      },
      required: ['name', 'center_coordinates']
    }
  })
  @ApiResponse({ status: 201, description: 'Custom map created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async createCustomMap(@Body() createMapDto: CreateMapDto): Promise<ApiResponse<CustomMap>> {
    try {
      if (!createMapDto.name || !createMapDto.center_coordinates) {
        throw new BadRequestException('Name and center coordinates are required');
      }

      const data = this.loadFromFile();
      const now = new Date().toISOString();
      
      const newMap: CustomMap = {
        id: this.generateUUID(),
        name: createMapDto.name,
        description: createMapDto.description || '',
        center_coordinates: createMapDto.center_coordinates,
        zoom_level: createMapDto.zoom_level || 5,
        bounds: createMapDto.bounds || { north: 37.0, south: 8.0, east: 97.0, west: 68.0 },
        active_layers: createMapDto.active_layers || [],
        is_default: createMapDto.is_default || false,
        created_at: now,
        updated_at: now
      };

      data.customMaps.push(newMap);
      this.saveToFile(data);
      
      return this.createResponse(true, 'Custom map created successfully', newMap);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new HttpException('Failed to create custom map', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }








}