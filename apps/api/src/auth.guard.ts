import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService, AuthUser } from './auth.service';

type AuthenticatedRequest = Request & { user?: AuthUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }
    const claims = this.authService.verifyAccessToken(header.slice(7));
    request.user = {
      id: claims.sub,
      email: claims.email,
      fullName: '',
      department: '',
      batchYear: 0,
      role: claims.role,
      trustScore: 0
    };
    return true;
  }
}

export type { AuthenticatedRequest };
