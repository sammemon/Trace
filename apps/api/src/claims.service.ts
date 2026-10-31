import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createClaimSchema, rejectClaimSchema } from '@trace/shared';
import { PrismaService } from './prisma.service';

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

  private toClaimantView(claim: any) {
    return { id: claim.id, status: claim.status, message: claim.message, answers: claim.answers, expiresAt: claim.expiresAt, createdAt: claim.createdAt, item: claim.item };
  }
}
