import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createItemSchema, itemQuerySchema } from '@trace/shared';
import { PrismaService } from './prisma.service';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: unknown) {
    const data = createItemSchema.parse(input);
    const [category, location] = await Promise.all([
      this.prisma.category.findFirst({ where: { id: data.categoryId, isActive: true } }),
      this.prisma.campusLocation.findFirst({ where: { id: data.locationId, isActive: true } })
    ]);
    if (!category || !location) throw new BadRequestException('Category or location is unavailable');

    const item = await this.prisma.item.create({
      data: {
        ...data,
        reporterId: userId,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      include: this.publicInclude()
    });
    return this.toPublicItem(item);
  }

  async list(input: unknown) {
    const query = itemQuerySchema.parse(input);
    const items = await this.prisma.item.findMany({
      where: {
        type: query.type,
        categoryId: query.categoryId,
        locationId: query.locationId,
        status: query.status,
        moderationStatus: 'VISIBLE',
        ...(query.search ? { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }, { brand: { contains: query.search, mode: 'insensitive' } }] } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
      include: this.publicInclude()
    });
    const hasMore = items.length > query.limit;
    const page = hasMore ? items.slice(0, query.limit) : items;
    return { data: page.map((item) => this.toPublicItem(item)), meta: { nextCursor: hasMore ? page.at(-1)?.id : null, hasMore } };
  }

  async getOne(id: string) {
    const item = await this.prisma.item.findFirst({ where: { id, moderationStatus: 'VISIBLE' }, include: this.publicInclude() });
    if (!item) throw new NotFoundException('Item not found');
    return this.toPublicItem(item);
  }

  private publicInclude() {
    return { category: { select: { id: true, name: true, slug: true, icon: true, isSensitive: true } }, location: { select: { id: true, name: true, type: true, lat: true, lng: true } }, reporter: { select: { id: true, fullName: true, avatarUrl: true, department: true, trustScore: true } } } as const;
  }

  private toPublicItem(item: any) {
    return { id: item.id, type: item.type, title: item.title, description: item.description, category: item.category, location: item.location, color: item.color, brand: item.brand, tags: item.tags, locationNote: item.locationNote, occurredAt: item.occurredAt, isTimeApproximate: item.isTimeApproximate, status: item.status, viewCount: item.viewCount, expiresAt: item.expiresAt, createdAt: item.createdAt, updatedAt: item.updatedAt, postedBy: item.reporter };
  }
}