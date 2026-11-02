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
@Roles('ADMIN')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const categories = await this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    return apiSuccess({ data: categories });
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: any) {
    const category = await this.prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        icon: body.icon,
        isSensitive: body.isSensitive,
        verificationTemplates: '[]',
        sortOrder: body.sortOrder ?? 0,
        isActive: true
      }
    });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'CREATE_CATEGORY', targetType: 'CATEGORY', targetId: category.id, metadata: '{}' }
    });
    return apiSuccess({ data: category });
  }

  @Patch(':id')
  async update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: any) {
    const category = await this.prisma.category.update({ where: { id }, data: body });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'UPDATE_CATEGORY', targetType: 'CATEGORY', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ data: category });
  }

  @Post(':id/toggle')
  async toggle(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new Error('Category not found');
    const updated = await this.prisma.category.update({ where: { id }, data: { isActive: !category.isActive } });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'TOGGLE_CATEGORY', targetType: 'CATEGORY', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ data: updated });
  }
}


