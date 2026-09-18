import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { aj } from './arcjet.client.js';

// Applies the base client's rules (Shield) to any route or controller marked
// with @UseGuards(ArcjetGuard). Guards run before the route handler, so a
// denied request never reaches your business logic.
@Injectable()
export class ArcjetGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new HttpException(
          'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (decision.reason.isBot()) {
        throw new HttpException('No bots allowed', HttpStatus.FORBIDDEN);
      }
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
