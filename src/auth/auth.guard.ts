import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';

// Applies to any route or controller marked with @UseGuards(AuthGuard),
// mirroring how ArcjetGuard is applied. Resolves the bearer token (or
// cookie) on the request into a Better Auth session and attaches it to the
// request for @Session() to read; rejects with 401 when there is none.
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const result = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!result) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // The admin plugin only blocks a banned user from creating a *new*
    // session (sign in); it does not revoke a session that already exists.
    // Check it here too, so a ban takes effect on the next request instead
    // of waiting for the session to expire on its own.
    if (result.user.banned) {
      throw new HttpException('Account is banned', HttpStatus.FORBIDDEN);
    }

    request.session = result;
    return true;
  }
}
