import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check / greeting' })
  @ApiOkResponse({
    description: 'Wrapped in the standard { statusCode, message, data } envelope.',
    schema: { example: { statusCode: 200, message: 'success', data: 'Hello World!' } },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
