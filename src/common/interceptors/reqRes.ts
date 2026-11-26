import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  statusCode: number;
  status: string;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ReqResInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;

        // If response is already formatted with our response utility
        if (data && typeof data === 'object' && ('status' in data || 'message' in data)) {
          return {
            statusCode,
            ...data,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          statusCode,
          status: 'success',
          message: 'Request successful',
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

// Backwards compatibility alias
export { ReqResInterceptor as EncryptionInterceptor };
