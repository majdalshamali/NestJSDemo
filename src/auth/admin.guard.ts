import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';

// Run after AuthGuard on any route restricted to admins (@UseGuards(AuthGuard, AdminGuard)).
// Assumes AuthGuard already attached the session; guard order matters.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.session?.user.role !== 'admin') {
      throw new HttpException('Admin access required', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
