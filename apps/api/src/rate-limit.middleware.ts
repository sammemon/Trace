import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly limiter: RateLimitService) {}

  use(request: Request, response: Response, next: NextFunction) {
    const policy = this.policy(request);
    if (!policy) return next();
    const identity = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const result = this.limiter.allow(`${policy.name}:${identity}`, policy.limit, policy.windowMs);
    if (!result.allowed) {
      response.setHeader('Retry-After', result.retryAfterSeconds);
      response.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } });
      return;
    }
    next();
  }

  private policy(request: Request) {
    const path = request.path;
    if (path === '/api/v1/auth/login' || path === '/api/v1/auth/register' || path === '/api/v1/auth/refresh') return { name: 'auth', limit: 5, windowMs: 60_000 };
    if (path === '/api/v1/auth/resend-otp') return { name: 'otp', limit: 3, windowMs: 60_000 };
    if (path === '/api/v1/items' && request.method === 'POST') return { name: 'items', limit: 10, windowMs: 24 * 60 * 60 * 1000 };
    if (path.includes('/claims') && request.method === 'POST') return { name: 'claims', limit: 3, windowMs: 24 * 60 * 60 * 1000 };
    if (path.includes('/messages') && request.method === 'POST') return { name: 'messages', limit: 30, windowMs: 60_000 };
    if (path === '/api/v1/uploads/presign' && request.method === 'POST') return { name: 'uploads', limit: 30, windowMs: 60 * 60 * 1000 };
    return undefined;
  }
}
