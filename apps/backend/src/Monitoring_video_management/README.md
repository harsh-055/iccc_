# Monitoring Video Management API

This module provides an API for managing video monitoring data with a hierarchical structure: City → Sector → Camera → Video (RTSP).

## API Endpoints

### GET `/api/v1/monitoring/video-management`

Retrieves the complete video management hierarchy with camera information and RTSP URLs.

### GET `/api/v1/monitoring/video-management/dashboard-overview`

Retrieves key performance indicators for the dashboard (waste collection, vehicles, workers, alerts).

### GET `/api/v1/monitoring/video-management/waste-management`

Retrieves zone-wise waste collection data and waste breakdown statistics.

### GET `/api/v1/monitoring/video-management/waste-breakdown`

Retrieves waste breakdown data specifically for donut chart visualization.

### GET `/api/v1/monitoring/video-management/alerts`

Retrieves real-time alerts from the system.

### GET `/api/v1/monitoring/video-management/garbage-movement`

Retrieves garbage movement records from transfer stations.

#### Response Structure

```json
{
  "city": {
    "name": "Gurugram",
    "sectors": [
      {
        "id": "sector-39",
        "name": "Sector 39",
        "cameras": [
          {
            "id": "camera-1",
            "name": "Camera 1",
            "status": "active",
            "rtsp_url": "rtsp://192.168.1.100:554/stream1",
            "last_update": "2025-08-22T09:42:36.274Z",
            "latitude": 28.4595,
            "longitude": 77.0266
          }
        ]
      }
    ]
  },
  "total_cameras": 25,
  "total_active_cameras": 23,
  "total_inactive_cameras": 2
}
```

#### Response Fields

- **city**: Object containing city information
  - **name**: City name (e.g., "Gurugram")
  - **sectors**: Array of sectors in the city
    - **id**: Unique sector identifier
    - **name**: Sector name (e.g., "Sector 39")
    - **cameras**: Array of cameras in the sector
      - **id**: Unique camera identifier
      - **name**: Camera name (e.g., "Camera 1")
      - **status**: Camera status ("active" or "inactive")
      - **rtsp_url**: RTSP URL for video stream
      - **last_update**: Last update timestamp (ISO 8601 format)
      - **latitude**: Camera latitude coordinate (decimal degrees)
      - **longitude**: Camera longitude coordinate (decimal degrees)

- **total_cameras**: Total number of cameras across all sectors
- **total_active_cameras**: Number of active cameras
- **total_inactive_cameras**: Number of inactive cameras

## Usage Examples

### Get Video Management Data
```bash
curl -X GET http://localhost:80/api/v1/monitoring/video-management
```

### Get Dashboard Overview
```bash
curl -X GET http://localhost:80/api/v1/monitoring/video-management/dashboard-overview
```

### Get Waste Management Data
```bash
curl -X GET http://localhost:80/api/v1/monitoring/video-management/waste-management
```

### Get Waste Breakdown Chart Data
```bash
curl -X GET http://localhost:80/api/v1/monitoring/video-management/waste-breakdown
```

### Get Live Alerts
```bash
curl -X GET http://localhost:80/api/v1/monitoring/video-management/alerts
```

### Get Garbage Movement Data
```bash
curl -X GET http://localhost:80/api/v1/monitoring/video-management/garbage-movement
```

## Features

- **No Database Required**: Uses static JSON data directly in the controller
- **Real-time Timestamps**: Updates timestamps on each request
- **GPS Coordinates**: Each camera includes latitude and longitude for map integration
- **Dashboard KPIs**: Waste collection, vehicles, workers, and alerts data
- **Waste Management**: Zone-wise collection data and waste breakdown
- **Live Alerts**: Real-time alert monitoring system
- **Garbage Movement**: Transfer station tracking and records
- **Swagger Documentation**: Available at `/api-docs`
- **TypeScript DTOs**: Fully typed response structure
- **Simple Structure**: No service layer - data directly in controller

## Implementation Details

- **Controller**: `MonitoringVideoManagementController` - Contains JSON data and handles HTTP requests
- **DTOs**: TypeScript classes for request/response validation
- **Module**: `MonitoringVideoManagementModule` - NestJS module configuration

## Integration

The module is automatically integrated into the main application via `app.module.ts` and is available at the `/api/v1/monitoring/video-management` endpoint. 