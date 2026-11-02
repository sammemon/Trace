import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { PrismaService } from './prisma.service';
import z from 'zod';

const itemQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['LOST', 'FOUND']).optional(),
  categoryId: z.string().optional(),
  status: z.enum(['ACTIVE', 'CLAIM_PENDING', 'RETURNED', 'RESOLVED', 'EXPIRED', 'REMOVED']).optional(),
  moderationStatus: z.enum(['VISIBLE', 'PENDING_REVIEW', 'HIDDEN']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional()
});

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'MODERATOR')
@Controller('admin/items')
export class AdminItemsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    const params = itemQuerySchema.parse(query);
    const where: any = {};
    if (params.search) {
      where.OR = [
        { title: { contains: params.search } },
        { description: { contains: params.search } }
      ];
    }
    if (params.type) where.type = params.type;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.status) where.status = params.status;
    if (params.moderationStatus) where.moderationStatus = params.moderationStatus;

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        include: { reporter: { select: { fullName: true, email: true } }, category: true },
        take: params.limit + 1,
        ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.item.count({ where })
    ]);

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return apiSuccess({
      data: page,
      meta: { nextCursor: hasMore ? page.at(-1)!.id : null, hasMore, total }
    });
  }

  @Post(':id/hide')
  async hide(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    await this.prisma.item.update({ where: { id }, data: { moderationStatus: 'HIDDEN' } });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'HIDE_ITEM', targetType: 'ITEM', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ success: true });
  }

  @Post(':id/restore')
  async restore(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    await this.prisma.item.update({ where: { id }, data: { moderationStatus: 'VISIBLE' } });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'RESTORE_ITEM', targetType: 'ITEM', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ success: true });
  }

  @Post(':id/remove')
  async remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    await this.prisma.item.update({ where: { id }, data: { status: 'REMOVED', moderationStatus: 'HIDDEN' } });
    await this.prisma.claim.updateMany({ where: { itemId: id, status: 'PENDING' }, data: { status: 'CANCELLED' } });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'REMOVE_ITEM', targetType: 'ITEM', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ success: true });
  }
}


