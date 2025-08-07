import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  DatabaseService,
  RealtimePayload,
} from '../../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'https://admin.socket.io',
      'http://localhost:80',
      'http://localhost:3000', // Add your frontend URL
      'chrome-extension://ophmdkgfcjapomjdpfobjfbihojchbko',
    ],
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private unsubscribe: () => void;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    // Subscribe to all database changes
    this.unsubscribe = this.databaseService.onRealtimeChange((payload) => {
      // Broadcast to all clients in the table room
      this.server.to(`table:${payload.table}`).emit('dataChange', payload);

      // Broadcast to specific record rooms if applicable
      if (payload.data?.id) {
        this.server
          .to(`${payload.table}:${payload.data.id}`)
          .emit('recordChange', payload);
      }
    });

    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);

    // Send a test message immediately
    client.emit('test', { message: 'You are connected!' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(client: Socket, payload: { tables: string[] }) {
    // Optional: Check permissions
    if (!client.data.authenticated && this.requiresAuth(payload.tables)) {
      return { error: 'Authentication required' };
    }

    for (const table of payload.tables) {
      client.join(`table:${table}`);
    }

    return {
      event: 'subscribed',
      tables: payload.tables,
      timestamp: new Date(),
    };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { tables: string[] }) {
    for (const table of payload.tables) {
      client.leave(`table:${table}`);
    }

    return {
      event: 'unsubscribed',
      tables: payload.tables,
      timestamp: new Date(),
    };
  }

  @SubscribeMessage('subscribeToRecord')
  handleSubscribeToRecord(
    client: Socket,
    payload: { table: string; id: string },
  ) {
    const room = `${payload.table}:${payload.id}`;
    client.join(room);

    return {
      event: 'subscribedToRecord',
      room,
      timestamp: new Date(),
    };
  }

  private requiresAuth(tables: string[]): boolean {
    // Define which tables require authentication
    const protectedTables = ['users', 'mfa', 'user_login_details'];
    return tables.some((table) => protectedTables.includes(table));
  }

  async onModuleDestroy() {
    this.unsubscribe?.();
  }
}
