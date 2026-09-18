import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { Session } from '../auth/session.decorator.js';
import type { AuthSession } from '../auth/session.types.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Admin only: listing every user is an admin capability.
  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  findAll() {
    return this.usersService.findAll();
  }

  // Self or admin only: a user can read their own record; anyone else's
  // requires the admin role.
  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string, @Session() session: AuthSession) {
    if (session.user.id !== id && session.user.role !== 'admin') {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
