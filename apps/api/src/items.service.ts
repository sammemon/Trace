import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createItemSchema, itemQuerySchema, updateItemSchema } from '@trace/shared';
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

  async mine(userId: string) {
    const items = await this.prisma.item.findMany({ where: { reporterId: userId }, orderBy: { createdAt: 'desc' }, include: this.publicInclude() });
    return items.map((item) => this.toPublicItem(item));
  }

  async update(userId: string, itemId: string, input: unknown) {
    const data = updateItemSchema.parse(input);
    const item = await this.requireOwner(userId, itemId);
    if (item.status !== 'ACTIVE') throw new BadRequestException('Only active items can be edited');
    const updated = await this.prisma.item.update({ where: { id: itemId }, data, include: this.publicInclude() });
    return this.toPublicItem(updated);
  }

  async remove(userId: string, itemId: string) {
    await this.requireOwner(userId, itemId);
    await this.prisma.item.update({ where: { id: itemId }, data: { status: 'REMOVED', resolvedAt: new Date() } });
    return { success: true };
  }

  async resolve(userId: string, itemId: string) {
    const item = await this.requireOwner(userId, itemId);
    if (!['ACTIVE', 'CLAIM_PENDING'].includes(item.status)) throw new BadRequestException('Only active items can be resolved');
    await this.prisma.item.update({ where: { id: itemId }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
    return { success: true };
  }

  async renew(userId: string, itemId: string) {
    const item = await this.requireOwner(userId, itemId);
    if (item.status !== 'EXPIRED') throw new BadRequestException('Only expired items can be renewed');
    if (item.lastRenewedAt && item.lastRenewedAt.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000) throw new BadRequestException('Item can only be renewed every 30 days');
    const renewed = await this.prisma.item.update({ where: { id: itemId }, data: { status: 'ACTIVE', expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), lastRenewedAt: new Date() }, include: this.publicInclude() });
    return this.toPublicItem(renewed);
  }

  async bookmark(userId: string, itemId: string) {
    const item = await this.prisma.item.findFirst({ where: { id: itemId, status: { in: ['ACTIVE', 'CLAIM_PENDING'] }, moderationStatus: 'VISIBLE' } });
    if (!item) throw new NotFoundException('Item not found');
    await this.prisma.bookmark.upsert({ where: { userId_itemId: { userId, itemId } }, create: { userId, itemId }, update: {} });
    return { bookmarked: true };
  }

  async unbookmark(userId: string, itemId: string) {
    await this.prisma.bookmark.deleteMany({ where: { userId, itemId } });
    return { bookmarked: false };
  }

  async bookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { item: { include: this.publicInclude() } } });
    return bookmarks.map(({ item }) => this.toPublicItem(item));
  }

  private async requireOwner(userId: string, itemId: string) {
    const item = await this.prisma.item.findFirst({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.reporterId !== userId) throw new BadRequestException('Only the item owner can perform this action');
    return item;
  }

  private publicInclude() {
    return { category: { select: { id: true, name: true, slug: true, icon: true, isSensitive: true } }, location: { select: { id: true, name: true, type: true, lat: true, lng: true } }, reporter: { select: { id: true, fullName: true, avatarUrl: true, department: true, trustScore: true } } } as const;
  }

  private toPublicItem(item: any) {
    return { id: item.id, type: item.type, title: item.title, description: item.description, category: item.category, location: item.location, color: item.color, brand: item.brand, tags: item.tags, locationNote: item.locationNote, occurredAt: item.occurredAt, isTimeApproximate: item.isTimeApproximate, status: item.status, viewCount: item.viewCount, expiresAt: item.expiresAt, createdAt: item.createdAt, updatedAt: item.updatedAt, postedBy: item.reporter };
  }
}