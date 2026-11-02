import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { PrismaService } from './prisma.service';
import z from 'zod';

const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  targetType: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional()
});

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'MODERATOR')
@Controller('admin/audit-logs')
export class AdminAuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    const params = auditLogQuerySchema.parse(query);
    const where: any = {};
    if (params.action) where.action = params.action;
    if (params.targetType) where.targetType = params.targetType;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { fullName: true, email: true, role: true } } },
        take: params.limit + 1,
        ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.auditLog.count({ where })
    ]);

    const hasMore = logs.length > params.limit;
    const page = hasMore ? logs.slice(0, params.limit) : logs;
    return apiSuccess({
      data: page,
      meta: { nextCursor: hasMore ? page.at(-1)!.id : null, hasMore, total }
    });
  }
}


