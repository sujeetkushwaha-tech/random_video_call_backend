import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    const request = ctx.getRequest<Request>();

    /*
      STATUS CODE
    */
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    /*
      DEFAULT VALUES
    */
    let message = 'Internal server error';

    let errors: any = [];

    /*
      HANDLE NESTJS ERRORS
    */
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      /*
        STRING ERROR
      */
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      /*
        OBJECT ERROR
      */
      if (typeof exceptionResponse === 'object') {
        const errorObj = exceptionResponse as any;

        message = errorObj.message || message;

        errors = Array.isArray(errorObj.message) ? errorObj.message : [];
      }
    }

    /*
      FINAL RESPONSE
    */
    response.status(status).json({
      success: false,
      // path: request.url,
      message: Array.isArray(message) ? 'Validation failed' : message,
      errors,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
