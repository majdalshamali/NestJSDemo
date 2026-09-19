import { Module } from '@nestjs/common';
import { MaratonService } from './maraton.service.js';
import { MaratonController } from './maraton.controller.js';

@Module({
  controllers: [MaratonController],
  providers: [MaratonService],
})
export class MaratonModule {}
