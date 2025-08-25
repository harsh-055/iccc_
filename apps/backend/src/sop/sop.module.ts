import { Module } from '@nestjs/common';
import { SOPController } from './sop.controller';

@Module({
  controllers: [SOPController],
})
export class SOPModule {}