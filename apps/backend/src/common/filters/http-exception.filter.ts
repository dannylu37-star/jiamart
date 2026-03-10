import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException
      ? exception.getResponse()
      : '服务器内部错误';
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('[500]', exception instanceof Error ? exception.message : exception,
        exception instanceof Error ? exception.stack?.split('\n').slice(0,3).join(' | ') : '');
    }
    res.status(status).json({ success: false, statusCode: status, message, timestamp: new Date().toISOString() });
  }
}
