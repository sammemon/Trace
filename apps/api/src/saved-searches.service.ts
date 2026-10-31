import { Injectable, NotFoundException } from '@nestjs/common';
import { savedSearchSchema } from '@trace/shared';
import { PrismaService } from './prisma.service';

@Injectable()
export class SavedSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.savedSearch.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { id: true, query: true, filters: true, notify: true, lastNotifiedAt: true, createdAt: true, updatedAt: true } });
  }

  async create(userId: string, input: unknown) {
    const data = savedSearchSchema.parse(input);
    return this.prisma.savedSearch.create({ data: { userId, query: data.query, filters: data.filters, notify: data.notify }, select: { id: true, query: true, filters: true, notify: true, createdAt: true, updatedAt: true } });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.savedSearch.deleteMany({ where: { id, userId } });
    if (!result.count) throw new NotFoundException('Saved search not found');
    return { success: true };
  }
}