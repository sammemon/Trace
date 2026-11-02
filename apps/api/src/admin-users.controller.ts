import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { PrismaService } from './prisma.service';
import z from 'zod';

const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['STUDENT', 'MODERATOR', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional()
});

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'MODERATOR')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    const params = userQuerySchema.parse(query);
    const where: any = {};
    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search } },
        { email: { contains: params.search } }
      ];
    }
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, fullName: true, department: true, batchYear: true,
          role: true, status: true, trustScore: true, createdAt: true
        },
        take: params.limit + 1,
        ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    const hasMore = users.length > params.limit;
    const page = hasMore ? users.slice(0, params.limit) : users;
    return apiSuccess({
      data: page,
      meta: { nextCursor: hasMore ? page.at(-1)!.id : null, hasMore, total }
    });
  }

  @Post(':id/warn')
  async warn(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: any) {
    await this.prisma.user.update({ where: { id }, data: { trustScore: { decrement: 10 } } });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'WARN_USER', targetType: 'USER', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ success: true });
  }

  @Post(':id/suspend')
  async suspend(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: any) {
    await this.prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'SUSPEND_USER', targetType: 'USER', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ success: true });
  }

  @Post(':id/ban')
  async ban(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: any) {
    await this.prisma.user.update({ where: { id }, data: { status: 'BANNED' } });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'BAN_USER', targetType: 'USER', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ success: true });
  }

  @Post(':id/restore')
  async restore(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    await this.prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'RESTORE_USER', targetType: 'USER', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ success: true });
  }

  @Post(':id/reset-trust')
  async resetTrust(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    await this.prisma.user.update({ where: { id }, data: { trustScore: 50 } });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'RESET_TRUST_SCORE', targetType: 'USER', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ success: true });
  }
}


