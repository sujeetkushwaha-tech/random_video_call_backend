import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(
    context: ExecutionContext,

    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        return {
          success: true,
          message: response?.message || 'Request successful',
          data: response?.data || response,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
