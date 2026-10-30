import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { PrismaService } from './prisma.service';

@ApiTags('reference-data')
@Controller()
export class ReferenceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('categories')
  async categories() {
    const categories = await this.prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true, icon: true, isSensitive: true, verificationTemplates: true } });
    return apiSuccess(categories);
  }

  @Get('locations')
  async locations() {
    const locations = await this.prisma.campusLocation.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, type: true, lat: true, lng: true, description: true, isSafeHandoverPoint: true } });
    return apiSuccess(locations);
  }
}