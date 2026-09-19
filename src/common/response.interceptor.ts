import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from './response-message.decorator.js';

export interface ApiResponseEnvelope<T> {
  statusCode: number;
  message: string;
  data: T;
}

// Wraps every successful controller response in a uniform envelope. Runs
// only on the success path (an RxJS map on next.handle()); a thrown
// HttpException still goes through Nest's normal exception handling
// unwrapped, the same as today.
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponseEnvelope<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseEnvelope<T>> {
    const message =
      this.reflector.get<string | undefined>(
        RESPONSE_MESSAGE_KEY,
        context.getHandler(),
      ) ?? 'success';

    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse<Response>().statusCode,
        message,
        data,
      })),
    );
  }
}
