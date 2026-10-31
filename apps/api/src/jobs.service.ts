import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireClaims() {
    const result = await this.prisma.claim.updateMany({ where: { status: { in: ['PENDING', 'MORE_INFO_REQUESTED'] }, expiresAt: { lt: new Date() } }, data: { status: 'EXPIRED' } });
    if (result.count) this.logger.log(`Expired ${result.count} claims`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireItems() {
    const result = await this.prisma.item.updateMany({ where: { status: { in: ['ACTIVE', 'CLAIM_PENDING'] }, expiresAt: { lt: new Date() } }, data: { status: 'EXPIRED' } });
    if (result.count) this.logger.log(`Expired ${result.count} items`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async notifyExpiringItems() {
    const now = new Date();
    const soon = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const items = await this.prisma.item.findMany({ where: { status: 'ACTIVE', expiresAt: { gt: now, lt: soon } }, select: { id: true, title: true, reporterId: true, expiresAt: true } });
    if (!items.length) return;
    await this.prisma.notification.createMany({ data: items.map((item) => ({ userId: item.reporterId, type: 'ITEM_EXPIRING_SOON', title: 'Item expiring soon', body: `${item.title} will expire soon. Renew it if it is still unresolved.`, data: { itemId: item.id, expiresAt: item.expiresAt.toISOString() } })) });
    this.logger.log(`Sent ${items.length} expiry reminders`);
  }
}