import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check / greeting' })
  @ApiOkResponse({ description: 'Plain text greeting.', type: String })
  getHello(): string {
    return this.appService.getHello();
  }
}
