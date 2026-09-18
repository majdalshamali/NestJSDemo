import { Module } from '@nestjs/common';
import { ProtectedController } from './protected.controller.js';

@Module({
  controllers: [ProtectedController],
})
export class ProtectedModule {}
