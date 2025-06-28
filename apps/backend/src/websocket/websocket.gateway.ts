import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: ["https://admin.socket.io","http://localhost:80","chrome-extension://ophmdkgfcjapomjdpfobjfbihojchbko"],
        credentials: true
    },
})
export class WebsocketsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    private readonly logger = new Logger(WebsocketsGateway.name);
    private clients: Set<Socket> = new Set();

    constructor() { }

    @WebSocketServer() server: Server;

    afterInit(server: Server) {
        instrument(this.server, {
            auth: false,
            mode: "development",
        });
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    this.clients.add(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client);
  }

  @SubscribeMessage('hi')
  async handlePoolRideEvents(client: Socket, payload: any): Promise<any> {
    this.server.emit('hi','hello')
  }
}