import { Module } from '@nestjs/common';
import { MapsController } from './maps.controller';

@Module({
  imports: [],
  controllers: [MapsController],
  providers: [],
})
export class MapsModule {}