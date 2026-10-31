import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createClaimSchema, handoverCodeSchema, rejectClaimSchema } from '@trace/shared';
import { PrismaService } from './prisma.service';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(claimantId: string, itemId: string, input: unknown) {
    const data = createClaimSchema.parse(input);
    const item = await this.prisma.item.findFirst({ where: { id: itemId, moderationStatus: 'VISIBLE' } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.reporterId === claimantId) throw new BadRequestException('You cannot claim your own item');
    if (!['ACTIVE', 'CLAIM_PENDING'].includes(item.status)) throw new BadRequestException('This item is not available for claims');
    const existing = await this.prisma.claim.findUnique({ where: { itemId_claimantId: { itemId, claimantId } } });
    if (existing && ['PENDING', 'MORE_INFO_REQUESTED', 'APPROVED'].includes(existing.status)) throw new BadRequestException('You already have an active claim for this item');
    const claim = await this.prisma.claim.create({ data: { itemId, claimantId, message: data.message, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), answers: { create: data.answers.map((answer) => ({ question: answer.question, answer: answer.answer })) } }, include: { answers: true, item: { select: { id: true, title: true, type: true } } } });
    return this.toClaimantView(claim);
  }

  async mine(claimantId: string) {
    const claims = await this.prisma.claim.findMany({ where: { claimantId }, orderBy: { createdAt: 'desc' }, include: { answers: true, item: { select: { id: true, title: true, type: true, status: true } } } });
    return claims.map((claim) => this.toClaimantView(claim));
  }

  async forItem(finderId: string, itemId: string) {
    const item = await this.prisma.item.findFirst({ where: { id: itemId, reporterId: finderId } });
    if (!item) throw new ForbiddenException('Only the item owner can review claims');
    return this.prisma.claim.findMany({ where: { itemId }, orderBy: { createdAt: 'desc' }, include: { answers: true, claimant: { select: { id: true, fullName: true, avatarUrl: true, department: true, batchYear: true, trustScore: true } }, item: { select: { id: true, title: true, privateDetailsEnc: true, verificationQuestions: true } } } });
  }

  async approve(finderId: string, claimId: string) {
    const claim = await this.prisma.claim.findUnique({ where: { id: claimId }, include: { item: true } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.item.reporterId !== finderId) throw new ForbiddenException('Only the item owner can approve claims');
    if (!['PENDING', 'MORE_INFO_REQUESTED'].includes(claim.status)) throw new BadRequestException('Claim is no longer pending');
    const updated = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.claim.findUnique({ where: { id: claimId } });
      if (!current || !['PENDING', 'MORE_INFO_REQUESTED'].includes(current.status)) throw new BadRequestException('Claim is no longer pending');
      await transaction.item.update({ where: { id: claim.itemId }, data: { status: 'CLAIM_PENDING' } });
      return transaction.claim.update({ where: { id: claimId }, data: { status: 'APPROVED', decidedAt: new Date() }, include: { answers: true, item: { select: { id: true, title: true, type: true } } } });
    });
    return this.toClaimantView(updated);
  }

  async reject(finderId: string, claimId: string, input: unknown) {
    const data = rejectClaimSchema.parse(input);
    const claim = await this.prisma.claim.findUnique({ where: { id: claimId }, include: { item: true } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.item.reporterId !== finderId) throw new ForbiddenException('Only the item owner can reject claims');
    if (!['PENDING', 'MORE_INFO_REQUESTED'].includes(claim.status)) throw new BadRequestException('Claim is no longer pending');
    const updated = await this.prisma.claim.update({ where: { id: claimId }, data: { status: 'REJECTED', rejectionReason: data.reason, decidedAt: new Date() }, include: { answers: true, item: { select: { id: true, title: true, type: true } } } });
    return this.toClaimantView(updated);
  }

  async generateHandoverCode(claimantId: string, claimId: string) {
    const claim = await this.prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.claimantId !== claimantId) throw new ForbiddenException('Only the claimant can generate this code');
    if (claim.status !== 'APPROVED') throw new BadRequestException('Claim must be approved before handover');
    const code = randomInt(100000, 1000000).toString();
    await this.prisma.claim.update({ where: { id: claimId }, data: { handoverCodeHash: this.hash(code), handoverCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), handoverAttempts: 0, handoverLockedUntil: null } });
    return { code, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
  }

  async complete(finderId: string, claimId: string, input: unknown) {
    const { code } = handoverCodeSchema.parse(input);
    const claim = await this.prisma.claim.findUnique({ where: { id: claimId }, include: { item: true } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.item.reporterId !== finderId) throw new ForbiddenException('Only the finder can complete handover');
    if (claim.status !== 'APPROVED') throw new BadRequestException('Claim is not ready for handover');
    if (claim.handoverLockedUntil && claim.handoverLockedUntil > new Date()) throw new BadRequestException('Handover verification is temporarily locked');
    if (!claim.handoverCodeHash || !claim.handoverCodeExpiresAt || claim.handoverCodeExpiresAt <= new Date()) throw new BadRequestException('Handover code is expired');
    if (!this.constantTimeEqual(claim.handoverCodeHash, this.hash(code))) {
      const attempts = claim.handoverAttempts + 1;
      await this.prisma.claim.update({ where: { id: claimId }, data: { handoverAttempts: attempts, ...(attempts >= 5 ? { handoverLockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : {}) } });
      throw new BadRequestException('Handover code is incorrect');
    }
    await this.prisma.$transaction(async (transaction) => {
      await transaction.claim.update({ where: { id: claimId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      await transaction.item.update({ where: { id: claim.itemId }, data: { status: 'RETURNED', resolvedAt: new Date() } });
    });
    return { success: true, status: 'COMPLETED' };
  }

  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }

  private constantTimeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left); const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }

  private toClaimantView(claim: any) {
    return { id: claim.id, status: claim.status, message: claim.message, answers: claim.answers, expiresAt: claim.expiresAt, createdAt: claim.createdAt, item: claim.item };
  }
}
