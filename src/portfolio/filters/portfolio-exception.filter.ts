import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class PortfolioExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'INTERNAL_SERVER_ERROR';
    let message = '서버 내부 오류가 발생했습니다.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as {
        error?: string;
        message?: string;
      };

      if (exceptionResponse.error) {
        error = exceptionResponse.error;
        message = exceptionResponse.message || '서버 내부 오류가 발생했습니다.';
      } else {
        message = exception.message;
      }
    }

    const errorResponse = {
      error,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest<Request>().url,
    };

    response.status(status).json(errorResponse);
  }
}
