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
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async index(@Req() request: AuthenticatedRequest) {
    const totalItems = await this.prisma.item.count();
    const returnedItems = await this.prisma.item.count({ where: { status: 'RETURNED' } });
    const openReports = await this.prisma.report.count({ where: { status: 'OPEN' } });
    const newUsers = await this.prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });
    return apiSuccess({
      activeLostItems: await this.prisma.item.count({ where: { type: 'LOST', status: 'ACTIVE' } }),
      activeFoundItems: await this.prisma.item.count({ where: { type: 'FOUND', status: 'ACTIVE' } }),
      itemsReturned: returnedItems,
      returnRate: totalItems > 0 ? Math.round((returnedItems / totalItems) * 100) : 0,
      openReports,
      newUsersThisWeek: newUsers
    });
  }
}


