import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthSession } from './session.types.js';

// Reads the session AuthGuard attached to the request. Requires the route to
// already be behind @UseGuards(AuthGuard); throws if used without it, rather
// than silently returning undefined, so a missing guard fails loudly.
export const Session = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthSession => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.session) {
      throw new InternalServerErrorException(
        '@Session() used on a route with no AuthGuard',
      );
    }
    return request.session;
  },
);
