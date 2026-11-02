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
@Controller('admin/locations')
export class AdminLocationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const locations = await this.prisma.campusLocation.findMany({ orderBy: { sortOrder: 'asc' } });
    return apiSuccess({ data: locations });
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: any) {
    const location = await this.prisma.campusLocation.create({
      data: {
        name: body.name,
        type: body.type,
        lat: body.lat,
        lng: body.lng,
        description: body.description,
        isSafeHandoverPoint: body.isSafeHandoverPoint,
        isActive: true,
        sortOrder: body.sortOrder ?? 0
      }
    });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'CREATE_LOCATION', targetType: 'LOCATION', targetId: location.id, metadata: '{}' }
    });
    return apiSuccess({ data: location });
  }

  @Patch(':id')
  async update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: any) {
    const location = await this.prisma.campusLocation.update({ where: { id }, data: body });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'UPDATE_LOCATION', targetType: 'LOCATION', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ data: location });
  }

  @Post(':id/toggle')
  async toggle(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    const location = await this.prisma.campusLocation.findUnique({ where: { id } });
    if (!location) throw new Error('Location not found');
    const updated = await this.prisma.campusLocation.update({ where: { id }, data: { isActive: !location.isActive } });
    await this.prisma.auditLog.create({
      data: { actorId: request.user!.id, action: 'TOGGLE_LOCATION', targetType: 'LOCATION', targetId: id, metadata: '{}' }
    });
    return apiSuccess({ data: updated });
  }
}


