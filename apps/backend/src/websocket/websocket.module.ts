import { Module } from '@nestjs/common';
import { RealtimeGateway } from './websocket.gateway';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [RealtimeGateway],
})
export class WebsocketModule {}''