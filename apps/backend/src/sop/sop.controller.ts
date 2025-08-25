import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Body, 
  HttpStatus, 
  HttpException
} from '@nestjs/common';
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

// SOP Interfaces - everything defined inline, no external DTOs needed
export interface SOP {
  id: string;
  name: string;
  description: string | null;
  priority: 'High' | 'Medium' | 'Low';
  createdBy: string;
  createdByName: string;
  updatedBy: string;
  updatedByName: string;
  tenantId: string | null;
  tenantName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    activities: Activity[];
    connections: Connection[];
  };
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  stepNumber: string;
  type: 'manual-activity' | 'automation-activity' | 'if-then-else-activity' | 'notification-activity' | 'sop-activity';
  notificationType?: 'email' | 'sms' | 'in-app' | 'webhook' | null;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
}

export interface CreateSopDto {
  name: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  tenantId?: string;
}

export interface CreateActivityDto {
  id: string;
  name: string;
  description?: string;
  stepNumber: string;
  type: 'manual-activity' | 'automation-activity' | 'if-then-else-activity' | 'notification-activity' | 'sop-activity';
  notificationType?: 'email' | 'sms' | 'in-app' | 'webhook';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

@ApiTags('SOPS')
@Controller('sops')
export class SOPController {
  
  // Path to store the JSON file
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'sops.json');

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
      this.saveToFile(this.getDefaultSOPs());
    }
  }

  // Load SOPs from JSON file
  private loadFromFile(): SOP[] {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error loading SOPs from file:', error);
      return this.getDefaultSOPs();
    }
  }

  // Save SOPs to JSON file
  private saveToFile(sops: SOP[]): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(sops, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving SOPs to file:', error);
      throw new HttpException('Failed to save data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get default SOPs data
  private getDefaultSOPs(): SOP[] {
    return [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "User Management SOP",
        description: "Comprehensive standard operating procedure for managing user accounts, including user onboarding, role assignments, access control, and account deactivation processes",
        priority: "High",
        createdBy: "user-001",
        createdByName: "John Doe",
        updatedBy: "user-002",
        updatedByName: "Raj Singh",
        tenantId: "tenant-001",
        tenantName: "ACME Corporation",
        isActive: true,
        createdAt: "2025-03-24T12:00:00.000Z",
        updatedAt: "2025-03-24T12:00:00.000Z",
        metadata: {
          activities: [
            {
              id: "node-1755149668414",
              name: "Manual Activity",
              description: "Review user request manually",
              stepNumber: "Step-1",
              type: "manual-activity"
            },
            {
              id: "node-1755149670506",
              name: "Automation Activity", 
              description: "Automatically validate user data",
              stepNumber: "Step-2",
              type: "automation-activity"
            }
          ],
          connections: [
            {
              id: "connection-1755149668414",
              source: "node-1755149668414",
              target: "node-1755149670506"
            }
          ]
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Email Protocol SOP",
        description: "Detailed protocols for email communication standards, including template management, approval workflows, and automated notification systems",
        priority: "Medium",
        createdBy: "user-003",
        createdByName: "Jane Smith",
        updatedBy: "user-002",
        updatedByName: "Raj Singh",
        tenantId: "tenant-001",
        tenantName: "ACME Corporation",
        isActive: true,
        createdAt: "2025-03-24T12:00:00.000Z",
        updatedAt: "2025-03-24T12:00:00.000Z",
        metadata: {
          activities: [
            {
              id: "node-1755149680001",
              name: "Draft Email",
              description: "Create initial email draft based on template",
              stepNumber: "Step-1",
              type: "manual-activity"
            },
            {
              id: "node-1755149680002",
              name: "Review Required?",
              description: "Check if manager review is needed based on email type",
              stepNumber: "Step-2",
              type: "if-then-else-activity"
            },
            {
              id: "node-1755149680003",
              name: "Manager Review",
              description: "Manager reviews and approves email content",
              stepNumber: "Step-3",
              type: "manual-activity"
            },
            {
              id: "node-1755149680004",
              name: "Send Email",
              description: "Automatically send approved email",
              stepNumber: "Step-4",
              type: "automation-activity"
            },
            {
              id: "node-1755149680005",
              name: "Log Communication",
              description: "Record email in communication log",
              stepNumber: "Step-5",
              type: "automation-activity"
            }
          ],
          connections: [
            {
              id: "connection-1755149680001",
              source: "node-1755149680001",
              target: "node-1755149680002"
            },
            {
              id: "connection-1755149680002",
              source: "node-1755149680002",
              target: "node-1755149680003"
            },
            {
              id: "connection-1755149680003",
              source: "node-1755149680003",
              target: "node-1755149680004"
            },
            {
              id: "connection-1755149680004",
              source: "node-1755149680002",
              target: "node-1755149680004"
            },
            {
              id: "connection-1755149680005",
              source: "node-1755149680004",
              target: "node-1755149680005"
            }
          ]
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        name: "Role Assignment SOP",
        description: "Standard procedures for assigning and managing user roles, permissions, and access levels across different system modules and departments",
        priority: "High",
        createdBy: "user-004",
        createdByName: "Mike Johnson",
        updatedBy: "user-002",
        updatedByName: "Raj Singh",
        tenantId: "tenant-001",
        tenantName: "ACME Corporation",
        isActive: true,
        createdAt: "2025-03-24T12:00:00.000Z",
        updatedAt: "2025-03-24T12:00:00.000Z",
        metadata: {
          activities: [
            {
              id: "node-1755149690001",
              name: "Receive Role Request",
              description: "Receive and log new role assignment request",
              stepNumber: "Step-1",
              type: "manual-activity"
            },
            {
              id: "node-1755149690002",
              name: "Verify User Identity",
              description: "Automatically verify user exists in system",
              stepNumber: "Step-2",
              type: "automation-activity"
            },
            {
              id: "node-1755149690003",
              name: "Check Department Approval",
              description: "Verify department head approval for role",
              stepNumber: "Step-3",
              type: "manual-activity"
            },
            {
              id: "node-1755149690004",
              name: "Assign Role",
              description: "System automatically assigns approved role",
              stepNumber: "Step-4",
              type: "automation-activity"
            },
            {
              id: "node-1755149690005",
              name: "Send Notification",
              description: "Notify user and manager of role assignment",
              stepNumber: "Step-5",
              type: "notification-activity",
              notificationType: "email"
            },
            {
              id: "node-1755149690006",
              name: "Update Audit Log",
              description: "Record role assignment in audit trail",
              stepNumber: "Step-6",
              type: "automation-activity"
            }
          ],
          connections: [
            {
              id: "connection-1755149690001",
              source: "node-1755149690001",
              target: "node-1755149690002"
            },
            {
              id: "connection-1755149690002",
              source: "node-1755149690002",
              target: "node-1755149690003"
            },
            {
              id: "connection-1755149690003",
              source: "node-1755149690003",
              target: "node-1755149690004"
            },
            {
              id: "connection-1755149690004",
              source: "node-1755149690004",
              target: "node-1755149690005"
            },
            {
              id: "connection-1755149690005",
              source: "node-1755149690005",
              target: "node-1755149690006"
            }
          ]
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        name: "Status Management SOP",
        description: "Guidelines for monitoring and updating system status, including incident reporting, escalation procedures, and status communication protocols",
        priority: "Low",
        createdBy: "user-005",
        createdByName: "Sarah Wilson",
        updatedBy: "user-002",
        updatedByName: "Raj Singh",
        tenantId: "tenant-001",
        tenantName: "ACME Corporation",
        isActive: true,
        createdAt: "2025-03-24T12:00:00.000Z",
        updatedAt: "2025-03-24T12:00:00.000Z",
        metadata: {
          activities: [
            {
              id: "node-1755149700001",
              name: "Monitor System Status",
              description: "Automated system health monitoring",
              stepNumber: "Step-1",
              type: "automation-activity"
            },
            {
              id: "node-1755149700002",
              name: "Detect Issue?",
              description: "Check if any issues detected",
              stepNumber: "Step-2",
              type: "if-then-else-activity"
            },
            {
              id: "node-1755149700003",
              name: "Create Incident Report",
              description: "Log incident details in system",
              stepNumber: "Step-3",
              type: "automation-activity"
            },
            {
              id: "node-1755149700004",
              name: "Notify Support Team",
              description: "Alert support team via multiple channels",
              stepNumber: "Step-4",
              type: "notification-activity",
              notificationType: "webhook"
            },
            {
              id: "node-1755149700005",
              name: "Update Status Dashboard",
              description: "Update public status page",
              stepNumber: "Step-5",
              type: "automation-activity"
            }
          ],
          connections: [
            {
              id: "connection-1755149700001",
              source: "node-1755149700001",
              target: "node-1755149700002"
            },
            {
              id: "connection-1755149700002",
              source: "node-1755149700002",
              target: "node-1755149700003"
            },
            {
              id: "connection-1755149700003",
              source: "node-1755149700003",
              target: "node-1755149700004"
            },
            {
              id: "connection-1755149700004",
              source: "node-1755149700004",
              target: "node-1755149700005"
            }
          ]
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        name: "Admin Access SOP",
        description: "Procedures for managing administrative access privileges, including super admin assignments, audit trails, and security compliance measures",
        priority: "High",
        createdBy: "user-006",
        createdByName: "David Brown",
        updatedBy: "user-002",
        updatedByName: "Raj Singh",
        tenantId: "tenant-001",
        tenantName: "ACME Corporation",
        isActive: true,
        createdAt: "2025-03-24T12:00:00.000Z",
        updatedAt: "2025-03-24T12:00:00.000Z",
        metadata: {
          activities: [
            {
              id: "node-1755149710001",
              name: "Admin Access Request",
              description: "Receive admin access request form",
              stepNumber: "Step-1",
              type: "manual-activity"
            },
            {
              id: "node-1755149710002",
              name: "Security Clearance Check",
              description: "Verify user security clearance level",
              stepNumber: "Step-2",
              type: "automation-activity"
            },
            {
              id: "node-1755149710003",
              name: "Executive Approval",
              description: "CTO or CEO approval required",
              stepNumber: "Step-3",
              type: "manual-activity"
            },
            {
              id: "node-1755149710004",
              name: "Configure Admin Access",
              description: "Set up admin privileges in system",
              stepNumber: "Step-4",
              type: "automation-activity"
            },
            {
              id: "node-1755149710005",
              name: "Enable MFA",
              description: "Enforce multi-factor authentication",
              stepNumber: "Step-5",
              type: "automation-activity"
            },
            {
              id: "node-1755149710006",
              name: "Send Credentials",
              description: "Send secure access credentials",
              stepNumber: "Step-6",
              type: "notification-activity",
              notificationType: "sms"
            },
            {
              id: "node-1755149710007",
              name: "Schedule Review",
              description: "Schedule quarterly access review",
              stepNumber: "Step-7",
              type: "automation-activity"
            }
          ],
          connections: [
            {
              id: "connection-1755149710001",
              source: "node-1755149710001",
              target: "node-1755149710002"
            },
            {
              id: "connection-1755149710002",
              source: "node-1755149710002",
              target: "node-1755149710003"
            },
            {
              id: "connection-1755149710003",
              source: "node-1755149710003",
              target: "node-1755149710004"
            },
            {
              id: "connection-1755149710004",
              source: "node-1755149710004",
              target: "node-1755149710005"
            },
            {
              id: "connection-1755149710005",
              source: "node-1755149710005",
              target: "node-1755149710006"
            },
            {
              id: "connection-1755149710006",
              source: "node-1755149710006",
              target: "node-1755149710007"
            }
          ]
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440006",
        name: "User Activity SOP",
        description: "Comprehensive tracking and monitoring procedures for user activities, session management, and behavioral analytics within the system",
        priority: "Medium",
        createdBy: "user-007",
        createdByName: "Lisa Davis",
        updatedBy: "user-002",
        updatedByName: "Raj Singh",
        tenantId: "tenant-001",
        tenantName: "ACME Corporation",
        isActive: true,
        createdAt: "2025-03-24T12:00:00.000Z",
        updatedAt: "2025-03-24T12:00:00.000Z",
        metadata: {
          activities: [
            {
              id: "node-1755149720001",
              name: "Track User Actions",
              description: "Monitor all user interactions in real-time",
              stepNumber: "Step-1",
              type: "automation-activity"
            },
            {
              id: "node-1755149720002",
              name: "Analyze Behavior Patterns",
              description: "AI-powered behavior analysis",
              stepNumber: "Step-2",
              type: "automation-activity"
            },
            {
              id: "node-1755149720003",
              name: "Suspicious Activity?",
              description: "Check for anomalous behavior",
              stepNumber: "Step-3",
              type: "if-then-else-activity"
            },
            {
              id: "node-1755149720004",
              name: "Security Alert",
              description: "Trigger security team notification",
              stepNumber: "Step-4",
              type: "notification-activity",
              notificationType: "in-app"
            },
            {
              id: "node-1755149720005",
              name: "Generate Activity Report",
              description: "Create detailed activity report",
              stepNumber: "Step-5",
              type: "automation-activity"
            },
            {
              id: "node-1755149720006",
              name: "Archive Session Data",
              description: "Store session data for compliance",
              stepNumber: "Step-6",
              type: "automation-activity"
            }
          ],
          connections: [
            {
              id: "connection-1755149720001",
              source: "node-1755149720001",
              target: "node-1755149720002"
            },
            {
              id: "connection-1755149720002",
              source: "node-1755149720002",
              target: "node-1755149720003"
            },
            {
              id: "connection-1755149720003",
              source: "node-1755149720003",
              target: "node-1755149720004"
            },
            {
              id: "connection-1755149720004",
              source: "node-1755149720003",
              target: "node-1755149720005"
            },
            {
              id: "connection-1755149720005",
              source: "node-1755149720005",
              target: "node-1755149720006"
            },
            {
              id: "connection-1755149720006",
              source: "node-1755149720004",
              target: "node-1755149720005"
            }
          ]
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440007",
        name: "Login Tracking SOP",
        description: "Standard operating procedures for tracking user login attempts, session timeouts, failed authentication alerts, and security monitoring protocols",
        priority: "Low",
        createdBy: "user-008",
        createdByName: "Tom Miller",
        updatedBy: "user-002",
        updatedByName: "Raj Singh",
        tenantId: "tenant-001",
        tenantName: "ACME Corporation",
        isActive: true,
        createdAt: "2025-03-24T12:00:00.000Z",
        updatedAt: "2025-03-24T12:00:00.000Z",
        metadata: {
          activities: [
            {
              id: "node-1755149730001",
              name: "Capture Login Attempt",
              description: "Record login attempt details",
              stepNumber: "Step-1",
              type: "automation-activity"
            },
            {
              id: "node-1755149730002",
              name: "Validate Credentials",
              description: "Check username and password",
              stepNumber: "Step-2",
              type: "automation-activity"
            },
            {
              id: "node-1755149730003",
              name: "Login Successful?",
              description: "Determine if login succeeded",
              stepNumber: "Step-3",
              type: "if-then-else-activity"
            },
            {
              id: "node-1755149730004",
              name: "Grant Access",
              description: "Create user session",
              stepNumber: "Step-4",
              type: "automation-activity"
            },
            {
              id: "node-1755149730005",
              name: "Failed Login Handler",
              description: "Process failed login attempt",
              stepNumber: "Step-5",
              type: "sop-activity"
            },
            {
              id: "node-1755149730006",
              name: "Log Authentication Event",
              description: "Store login event in audit log",
              stepNumber: "Step-6",
              type: "automation-activity"
            }
          ],
          connections: [
            {
              id: "connection-1755149730001",
              source: "node-1755149730001",
              target: "node-1755149730002"
            },
            {
              id: "connection-1755149730002",
              source: "node-1755149730002",
              target: "node-1755149730003"
            },
            {
              id: "connection-1755149730003",
              source: "node-1755149730003",
              target: "node-1755149730004"
            },
            {
              id: "connection-1755149730004",
              source: "node-1755149730003",
              target: "node-1755149730005"
            },
            {
              id: "connection-1755149730005",
              source: "node-1755149730004",
              target: "node-1755149730006"
            },
            {
              id: "connection-1755149730006",
              source: "node-1755149730005",
              target: "node-1755149730006"
            }
          ]
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440008",
        name: "Security Protocol SOP",
        description: "Advanced security protocols including threat detection, incident response procedures, data protection measures, and compliance monitoring standards",
        priority: "High",
        createdBy: "user-009",
        createdByName: "Emma Wilson",
        updatedBy: "user-002",
        updatedByName: "Raj Singh",
        tenantId: "tenant-001",
        tenantName: "ACME Corporation",
        isActive: true,
        createdAt: "2025-03-24T12:00:00.000Z",
        updatedAt: "2025-03-24T12:00:00.000Z",
        metadata: {
          activities: [
            {
              id: "node-1755149740001",
              name: "Continuous Threat Monitoring",
              description: "24/7 automated threat detection",
              stepNumber: "Step-1",
              type: "automation-activity"
            },
            {
              id: "node-1755149740002",
              name: "Threat Level Assessment",
              description: "Evaluate threat severity",
              stepNumber: "Step-2",
              type: "automation-activity"
            },
            {
              id: "node-1755149740003",
              name: "Critical Threat?",
              description: "Determine if immediate action needed",
              stepNumber: "Step-3",
              type: "if-then-else-activity"
            },
            {
              id: "node-1755149740004",
              name: "Emergency Response",
              description: "Activate emergency security protocol",
              stepNumber: "Step-4",
              type: "sop-activity"
            },
            {
              id: "node-1755149740005",
              name: "Security Team Alert",
              description: "Notify security team immediately",
              stepNumber: "Step-5",
              type: "notification-activity",
              notificationType: "webhook"
            },
            {
              id: "node-1755149740006",
              name: "Isolate Threat",
              description: "Contain and isolate security threat",
              stepNumber: "Step-6",
              type: "automation-activity"
            },
            {
              id: "node-1755149740007",
              name: "Forensic Analysis",
              description: "Detailed security incident analysis",
              stepNumber: "Step-7",
              type: "manual-activity"
            },
            {
              id: "node-1755149740008",
              name: "Update Security Measures",
              description: "Implement enhanced security controls",
              stepNumber: "Step-8",
              type: "automation-activity"
            }
          ],
          connections: [
            {
              id: "connection-1755149740001",
              source: "node-1755149740001",
              target: "node-1755149740002"
            },
            {
              id: "connection-1755149740002",
              source: "node-1755149740002",
              target: "node-1755149740003"
            },
            {
              id: "connection-1755149740003",
              source: "node-1755149740003",
              target: "node-1755149740004"
            },
            {
              id: "connection-1755149740004",
              source: "node-1755149740004",
              target: "node-1755149740005"
            },
            {
              id: "connection-1755149740005",
              source: "node-1755149740005",
              target: "node-1755149740006"
            },
            {
              id: "connection-1755149740006",
              source: "node-1755149740006",
              target: "node-1755149740007"
            },
            {
              id: "connection-1755149740007",
              source: "node-1755149740007",
              target: "node-1755149740008"
            },
            {
              id: "connection-1755149740008",
              source: "node-1755149740003",
              target: "node-1755149740007"
            }
          ]
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440009",
        name: "Access Control SOP",
        description: "Detailed access control procedures including authentication methods, authorization levels, multi-factor authentication, and access revocation processes",
        priority: "Medium",
        createdBy: "user-010",
        createdByName: "Alex Taylor",
        updatedBy: "user-002",
        updatedByName: "Raj Singh",
        tenantId: "tenant-001",
        tenantName: "ACME Corporation",
        isActive: true,
        createdAt: "2025-03-24T12:00:00.000Z",
        updatedAt: "2025-03-24T12:00:00.000Z",
        metadata: {
          activities: [
            {
              id: "node-1755149750001",
              name: "Access Request",
              description: "User requests system access",
              stepNumber: "Step-1",
              type: "manual-activity"
            },
            {
              id: "node-1755149750002",
              name: "Identity Verification",
              description: "Verify user identity via ID provider",
              stepNumber: "Step-2",
              type: "automation-activity"
            },
            {
              id: "node-1755149750003",
              name: "Check Access Policy",
              description: "Validate against access control policies",
              stepNumber: "Step-3",
              type: "automation-activity"
            },
            {
              id: "node-1755149750004",
              name: "MFA Required?",
              description: "Check if MFA is required for resource",
              stepNumber: "Step-4",
              type: "if-then-else-activity"
            },
            {
              id: "node-1755149750005",
              name: "MFA Challenge",
              description: "Send MFA code to user device",
              stepNumber: "Step-5",
              type: "notification-activity",
              notificationType: "sms"
            },
            {
              id: "node-1755149750006",
              name: "Grant Access Token",
              description: "Issue time-limited access token",
              stepNumber: "Step-6",
              type: "automation-activity"
            },
            {
              id: "node-1755149750007",
              name: "Monitor Access",
              description: "Track resource access in real-time",
              stepNumber: "Step-7",
              type: "automation-activity"
            },
            {
              id: "node-1755149750008",
              name: "Session Expiry Check",
              description: "Monitor and enforce session timeout",
              stepNumber: "Step-8",
              type: "automation-activity"
            }
          ],
          connections: [
            {
              id: "connection-1755149750001",
              source: "node-1755149750001",
              target: "node-1755149750002"
            },
            {
              id: "connection-1755149750002",
              source: "node-1755149750002",
              target: "node-1755149750003"
            },
            {
              id: "connection-1755149750003",
              source: "node-1755149750003",
              target: "node-1755149750004"
            },
            {
              id: "connection-1755149750004",
              source: "node-1755149750004",
              target: "node-1755149750005"
            },
            {
              id: "connection-1755149750005",
              source: "node-1755149750005",
              target: "node-1755149750006"
            },
            {
              id: "connection-1755149750006",
              source: "node-1755149750004",
              target: "node-1755149750006"
            },
            {
              id: "connection-1755149750007",
              source: "node-1755149750006",
              target: "node-1755149750007"
            },
            {
              id: "connection-1755149750008",
              source: "node-1755149750007",
              target: "node-1755149750008"
            }
          ]
        }
      }
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

  // Helper method to generate UUIDs (simple mock)
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new SOP' })
  @ApiResponse({ 
    status: 201, 
    description: 'SOP created successfully'
  })
  @ApiBody({
    description: 'SOP creation data',
    examples: {
      basicSop: {
        summary: 'Create basic SOP',
        value: {
          name: 'User Management SOP',
          description: 'Standard Operating Procedure for managing users in the system',
          priority: 'High'
        }
      }
    }
  })
  async create(@Body() createSopDto: CreateSopDto): Promise<ApiResponse<SOP>> {
    try {
      if (!createSopDto.name || !createSopDto.priority) {
        throw new HttpException(
          this.createResponse(false, 'Name and priority are required'),
          HttpStatus.BAD_REQUEST
        );
      }

      // Load current SOPs from file
      const sops = this.loadFromFile();

      const newSOP: SOP = {
        id: this.generateUUID(),
        name: createSopDto.name,
        description: createSopDto.description || null,
        priority: createSopDto.priority,
        createdBy: "current-user-id",
        createdByName: "Current User",
        updatedBy: "current-user-id",
        updatedByName: "Current User",
        tenantId: createSopDto.tenantId || "tenant-001",
        tenantName: "ACME Corporation",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          activities: [],
          connections: []
        }
      };

      // Add to array and save to file
      sops.push(newSOP);
      this.saveToFile(sops);

      return this.createResponse(true, 'SOP created successfully', newSOP);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to create SOP'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all SOPs with pagination or get a specific SOP by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'SOPs retrieved successfully'
  })
  @ApiQuery({ name: 'id', required: false, type: String, description: 'Optional SOP ID to get a specific SOP' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip', example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take', example: 10 })
  async findAll(
    @Query('id') id?: string,
    @Query('skip') skip = 0, 
    @Query('take') take = 10
  ): Promise<ApiResponse<SOP | {
    data: SOP[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      // Load SOPs from file
      const sops = this.loadFromFile();
      
      // If ID is provided, return specific SOP
      if (id) {
        const sop = sops.find(s => s.id === id);
        
        if (!sop) {
          throw new HttpException(
            this.createResponse(false, `SOP with ID ${id} not found`),
            HttpStatus.NOT_FOUND
          );
        }
        return this.createResponse(true, 'SOP retrieved successfully', sop);
      }
      
      // Otherwise return paginated list
      const startIndex = Number(skip) || 0;
      const pageSize = Number(take) || 10;
      const endIndex = startIndex + pageSize;

      const paginatedSops = sops.slice(startIndex, endIndex);
      const total = sops.length;
      const totalPages = Math.ceil(total / pageSize);
      const currentPage = Math.floor(startIndex / pageSize) + 1;

      const result = {
        data: paginatedSops,
        total,
        page: currentPage,
        limit: pageSize,
        totalPages
      };

      return this.createResponse(true, 'SOPs retrieved successfully', result);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to retrieve SOPs'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/activities')
  @ApiOperation({ summary: 'Add an activity to SOP workflow' })
  @ApiResponse({ 
    status: 201, 
    description: 'Activity created successfully'
  })
  @ApiParam({ name: 'id', description: 'SOP ID' })
  @ApiBody({
    description: 'Activity creation data',
    examples: {
      manualActivity: {
        summary: 'Create manual activity',
        value: {
          id: 'node-1755149668414',
          name: 'Manual Activity',
          description: 'User needs to manually verify the document',
          stepNumber: 'Step-1',
          type: 'manual-activity'
        }
      }
    }
  })
  async createActivity(@Param('id') id: string, @Body() createActivityDto: CreateActivityDto): Promise<ApiResponse<Activity>> {
    try {
      // Load SOPs from file
      const sops = this.loadFromFile();
      const sopIndex = sops.findIndex(s => s.id === id);
      
      if (sopIndex === -1) {
        throw new HttpException(
          this.createResponse(false, `SOP with ID ${id} not found`),
          HttpStatus.NOT_FOUND
        );
      }

      const sop = sops[sopIndex];
      if (!sop.metadata) {
        sop.metadata = { activities: [], connections: [] };
      }

      // Check if activity ID already exists
      const existingActivity = sop.metadata.activities.find(a => a.id === createActivityDto.id);
      if (existingActivity) {
        throw new HttpException(
          this.createResponse(false, `Activity with ID '${createActivityDto.id}' already exists`),
          HttpStatus.BAD_REQUEST
        );
      }

      const newActivity: Activity = {
        id: createActivityDto.id,
        name: createActivityDto.name,
        description: createActivityDto.description || '',
        stepNumber: createActivityDto.stepNumber,
        type: createActivityDto.type,
        notificationType: createActivityDto.notificationType || null
      };

      sop.metadata.activities.push(newActivity);
      sop.updatedAt = new Date().toISOString();

      // Save updated data to file
      this.saveToFile(sops);

      return this.createResponse(true, 'Activity created successfully', newActivity);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        this.createResponse(false, 'Failed to create activity'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  }
