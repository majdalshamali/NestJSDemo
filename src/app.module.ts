import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProtectedModule } from './protected/protected.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [PrismaModule, ProtectedModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
