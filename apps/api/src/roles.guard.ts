import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@trace/shared';
import { ROLES_KEY } from './roles.decorator';
import type { AuthenticatedRequest } from './auth.guard';

const roleRank: Record<Role, number> = { STUDENT: 1, MODERATOR: 2, ADMIN: 3 };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user || !required.some((role) => roleRank[user.role] >= roleRank[role])) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}