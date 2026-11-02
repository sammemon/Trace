import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { PrismaService } from './prisma.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'MODERATOR')
@Controller('admin/handover-desk')
export class AdminHandoverDeskController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    const items = await this.prisma.item.findMany({
      where: { handoverMode: 'DEPOSITED_AT_OFFICE', status: 'CLAIM_PENDING' },
      include: {
        claims: { include: { claimant: { select: { fullName: true, email: true, trustScore: true } } } },
        reporter: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return apiSuccess({ data: items });
  }

  @Post(':itemId/mark-returned')
  async markReturned(@Req() request: AuthenticatedRequest, @Param('itemId') itemId: string, @Body() body: any) {
    await this.prisma.$transaction([
      this.prisma.item.update({ where: { id: itemId }, data: { status: 'RETURNED' } }),
      this.prisma.claim.updateMany({ where: { itemId, status: 'PENDING' }, data: { status: 'COMPLETED', completedAt: new Date() } }),
      this.prisma.auditLog.create({
        data: { actorId: request.user!.id, action: 'MARK_ITEM_RETURNED', targetType: 'ITEM', targetId: itemId, metadata: '{}' }
      })
    ]);
    return apiSuccess({ success: true });
  }
}


