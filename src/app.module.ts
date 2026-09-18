import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProtectedModule } from './protected/protected.module.js';

@Module({
  imports: [ProtectedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
