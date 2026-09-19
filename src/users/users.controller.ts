import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { ResponseMessage } from '../common/response-message.decorator.js';
import { Session } from '../auth/session.decorator.js';
import type { AuthSession } from '../auth/session.types.js';
import { UsersService } from './users.service.js';

const userExample = {
  id: 'WQKxx3EYW6ofM69P6RvyXMNiUK9Nqz8i',
  name: 'Alice',
  email: 'alice@example.com',
  emailVerified: false,
  image: null,
  role: 'user',
  banned: false,
  banReason: null,
  banExpires: null,
  createdAt: '2026-09-18T23:24:17.158Z',
  updatedAt: '2026-09-18T23:24:17.158Z',
};

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Admin only: listing every user is an admin capability.
  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({
    summary: 'List every user',
    description: 'Admin only. Creating a user is sign up, not this API; see /api/auth/reference.',
  })
  @ApiOkResponse({
    description: 'Every user, newest first, wrapped in the standard { statusCode, message, data } envelope.',
    schema: { example: { statusCode: 200, message: 'Users listed', data: [userExample] } },
  })
  @ApiUnauthorizedResponse({ description: 'No, missing, or invalid bearer token.' })
  @ApiForbiddenResponse({ description: 'Caller is authenticated but not an admin.' })
  @ResponseMessage('Users listed')
  findAll() {
    return this.usersService.findAll();
  }

  // Self or admin only: a user can read their own record; anyone else's
  // requires the admin role.
  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get one user',
    description: 'The caller\'s own record, or any record if the caller is an admin.',
  })
  @ApiParam({ name: 'id', description: 'The Better Auth user id.', example: userExample.id })
  @ApiOkResponse({
    description: 'The user, wrapped in the standard { statusCode, message, data } envelope.',
    schema: { example: { statusCode: 200, message: 'User found', data: userExample } },
  })
  @ApiUnauthorizedResponse({ description: 'No, missing, or invalid bearer token.' })
  @ApiForbiddenResponse({ description: 'Caller is neither the owner nor an admin.' })
  @ApiNotFoundResponse({ description: 'No user with that id.' })
  @ResponseMessage('User found')
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
