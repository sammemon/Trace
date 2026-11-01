import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async matchForItem(itemId: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId }, include: { category: true, location: true } });
    if (!item || item.status !== 'ACTIVE') return [];
    if (item.type === 'FOUND' && item.idNumberHash) {
      const owners = await this.prisma.user.findMany({ where: { studentIdHash: item.idNumberHash, status: 'ACTIVE' }, select: { id: true } });
      if (owners.length) await this.prisma.notification.createMany({ data: owners.map((owner) => ({ userId: owner.id, type: 'ID_CARD_POSSIBLE_MATCH', title: 'Possible ID card match', body: 'An ID card matching your registered details may have been found.', data: JSON.stringify({ itemId: item.id }) })) });
    }
    const opposite = item.type === 'LOST' ? 'FOUND' : 'LOST';
    const candidates = await this.prisma.item.findMany({ where: { type: opposite, status: { in: ['ACTIVE', 'CLAIM_PENDING'] }, moderationStatus: 'VISIBLE', categoryId: item.categoryId }, include: { location: true } });
    const matches = [];
    for (const candidate of candidates) {
      const lost = item.type === 'LOST' ? item : candidate;
      const found = item.type === 'FOUND' ? item : candidate;
      const scored = this.score(lost, found);
      if (scored.score < 60) continue;
      const match = await this.prisma.match.upsert({ where: { lostItemId_foundItemId: { lostItemId: lost.id, foundItemId: found.id } }, create: { lostItemId: lost.id, foundItemId: found.id, score: scored.score, reasons: JSON.stringify(scored.reasons) }, update: { score: scored.score, reasons: JSON.stringify(scored.reasons), status: 'NEW' } });
      matches.push(match);
      await this.prisma.notification.create({ data: { userId: lost.reporterId, type: 'MATCH_FOUND', title: 'Possible match found', body: 'A new found item may match your lost item.', data: JSON.stringify({ matchId: match.id, itemId: found.id }) } });
    }
    if (matches.length) this.logger.log(`Created ${matches.length} possible matches for ${itemId}`);
    return matches;
  }

  async matchesForOwner(userId: string, itemId: string) {
    const item = await this.prisma.item.findFirst({ where: { id: itemId, reporterId: userId, type: 'LOST' } });
    if (!item) return [];
    return this.prisma.match.findMany({ where: { lostItemId: itemId }, orderBy: { score: 'desc' }, select: { id: true, score: true, reasons: true, status: true, createdAt: true, foundItem: { select: { id: true, title: true, description: true, color: true, location: { select: { id: true, name: true } }, category: { select: { id: true, name: true } } } } } });
  }

  private score(lost: any, found: any) {
    let score = 60;
    const reasons: string[] = ['category'];
    if (lost.color && found.color && lost.color.toLowerCase() === found.color.toLowerCase()) { score += 15; reasons.push('color'); }
    if (lost.locationId === found.locationId) { score += 15; reasons.push('location'); }
    const lostWords = new Set(`${lost.title} ${lost.description} ${lost.brand ?? ''}`.toLowerCase().split(/\W+/).filter(Boolean));
    const foundWords = `${found.title} ${found.description} ${found.brand ?? ''}`.toLowerCase().split(/\W+/).filter(Boolean);
    if (foundWords.some((word: string) => lostWords.has(word))) { score += 10; reasons.push('description'); }
    return { score: Math.min(score, 100), reasons };
  }
}
