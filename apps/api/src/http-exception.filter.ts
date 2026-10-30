import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : exception instanceof ZodError ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof ZodError ? 'Request validation failed' : exception instanceof HttpException ? this.httpMessage(exception) : 'Internal server error';
    const details = exception instanceof ZodError ? exception.flatten().fieldErrors : undefined;

    response.status(status).json({
      error: {
        code: this.errorCode(status),
        message,
        ...(details ? { details } : {})
      },
      meta: { requestId: request.headers['x-request-id'] ?? undefined }
    });
  }

  private httpMessage(exception: HttpException) {
    const response = exception.getResponse();
    return typeof response === 'string' ? response : (response as { message?: string | string[] }).message ?? exception.message;
  }

  private errorCode(status: number) {
    if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';
  }
}
