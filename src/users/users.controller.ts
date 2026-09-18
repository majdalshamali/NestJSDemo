import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: { email?: string; name?: string }) {
    if (!body?.email) {
      throw new HttpException(
        'Body must include an "email" field',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.usersService.create({ email: body.email, name: body.name });
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // ParseIntPipe converts the ":id" path segment to a number and returns
  // 400 automatically if it is not numeric.
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
