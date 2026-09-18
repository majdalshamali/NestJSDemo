import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global makes PrismaService injectable everywhere without each feature
// module having to import PrismaModule.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
