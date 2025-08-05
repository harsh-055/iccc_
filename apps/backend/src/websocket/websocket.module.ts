import { Module } from '@nestjs/common';
import { RealtimeGateway } from './websocket.gateway';

import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [

    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [RealtimeGateway],
})
export class WebsocketModule {}