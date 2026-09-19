import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard.js';
import { AdminGuard } from '../../auth/admin.guard.js';
import { ResponseMessage } from '../../common/response-message.decorator.js';
import { Session } from '../../auth/session.decorator.js';
import type { AuthSession } from '../../auth/session.types.js';
import { CreateMaratonDto } from './dto/create-maraton.dto.js';
import { UpdateMaratonDto } from './dto/update-maraton.dto.js';
import { MaratonService } from './maraton.service.js';

const maratonExample = {
  id: 'cmg1s8x9x0000abcd1234efgh',
  name: 'City Marathon 2027',
  description: null,
  startDate: '2027-04-12T08:00:00.000Z',
  endDate: '2027-04-12T14:00:00.000Z',
  isActive: false,
  authorId: 'WQKxx3EYW6ofM69P6RvyXMNiUK9Nqz8i',
  createdAt: '2026-09-19T14:52:57.000Z',
  updatedAt: '2026-09-19T14:52:57.000Z',
};

@ApiTags('Maraton')
@Controller('maraton')
export class MaratonController {
  constructor(private readonly maratonService: MaratonService) {}

  // Admin only: the caller becomes the Maraton's author.
  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a Maraton',
    description:
      'Admin only. The authenticated caller is recorded as the author.',
  })
  @ApiCreatedResponse({
    description:
      'The created Maraton, wrapped in the standard { statusCode, message, data } envelope.',
    schema: {
      example: {
        statusCode: 201,
        message: 'Maraton created',
        data: maratonExample,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No, missing, or invalid bearer token.',
  })
  @ApiForbiddenResponse({
    description: 'Caller is authenticated but not an admin.',
  })
  @ResponseMessage('Maraton created')
  create(@Body() dto: CreateMaratonDto, @Session() session: AuthSession) {
    return this.maratonService.create(dto, session.user.id);
  }

  // Public: anyone can list Maratons.
  @Get()
  @ApiOperation({ summary: 'List every Maraton' })
  @ApiOkResponse({
    description:
      'Every Maraton, newest first, wrapped in the standard { statusCode, message, data } envelope.',
    schema: {
      example: { statusCode: 200, message: 'success', data: [maratonExample] },
    },
  })
  findAll() {
    return this.maratonService.findAll();
  }

  // Public: anyone can read a single Maraton.
  @Get(':id')
  @ApiOperation({ summary: 'Get one Maraton' })
  @ApiParam({ name: 'id', example: maratonExample.id })
  @ApiOkResponse({
    description:
      'The Maraton, wrapped in the standard { statusCode, message, data } envelope.',
    schema: {
      example: { statusCode: 200, message: 'success', data: maratonExample },
    },
  })
  @ApiNotFoundResponse({ description: 'No Maraton with that id.' })
  findOne(@Param('id') id: string) {
    return this.maratonService.findOne(id);
  }

  // Admin only.
  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a Maraton', description: 'Admin only.' })
  @ApiParam({ name: 'id', example: maratonExample.id })
  @ApiOkResponse({
    description:
      'The updated Maraton, wrapped in the standard { statusCode, message, data } envelope.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Maraton updated',
        data: maratonExample,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No, missing, or invalid bearer token.',
  })
  @ApiForbiddenResponse({
    description: 'Caller is authenticated but not an admin.',
  })
  @ApiNotFoundResponse({ description: 'No Maraton with that id.' })
  @ResponseMessage('Maraton updated')
  update(@Param('id') id: string, @Body() dto: UpdateMaratonDto) {
    return this.maratonService.update(id, dto);
  }

  // Admin only.
  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a Maraton', description: 'Admin only.' })
  @ApiParam({ name: 'id', example: maratonExample.id })
  @ApiOkResponse({
    description:
      'Empty body, wrapped in the standard { statusCode, message, data } envelope.',
    schema: {
      example: { statusCode: 200, message: 'Maraton deleted', data: null },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No, missing, or invalid bearer token.',
  })
  @ApiForbiddenResponse({
    description: 'Caller is authenticated but not an admin.',
  })
  @ApiNotFoundResponse({ description: 'No Maraton with that id.' })
  @ResponseMessage('Maraton deleted')
  remove(@Param('id') id: string) {
    return this.maratonService.remove(id);
  }

  // Any authenticated user (not just admins) can join an active Maraton.
  @Post(':id/join')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Join a Maraton',
    description:
      'Any authenticated user. Requires the Maraton to be active and not yet ended.',
  })
  @ApiParam({ name: 'id', example: maratonExample.id })
  @ApiCreatedResponse({
    description:
      'Participation recorded, wrapped in the standard { statusCode, message, data } envelope.',
    schema: {
      example: {
        statusCode: 201,
        message: 'Joined Maraton',
        data: {
          id: 'cmg1s9y0y0001abcd5678ijkl',
          maratonId: maratonExample.id,
          userId: 'WQKxx3EYW6ofM69P6RvyXMNiUK9Nqz8i',
          createdAt: '2026-09-19T15:00:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No, missing, or invalid bearer token.',
  })
  @ApiNotFoundResponse({ description: 'No Maraton with that id.' })
  @ApiBadRequestResponse({
    description:
      'Maraton is not active, has already ended, or the caller already joined.',
  })
  @ResponseMessage('Joined Maraton')
  join(@Param('id') id: string, @Session() session: AuthSession) {
    return this.maratonService.join(id, session.user.id);
  }
}
