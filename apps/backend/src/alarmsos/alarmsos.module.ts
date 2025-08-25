import { Module } from '@nestjs/common';
import { SOSIncidentsController } from './alarmsos.controller';

@Module({
  controllers: [SOSIncidentsController],
})
export class SOSIncidentsModule {}