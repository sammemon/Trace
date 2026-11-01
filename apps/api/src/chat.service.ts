import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { messageSchema } from '@trace/shared';
import { PrismaService } from './prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async conversations(userId: string) {
    return this.prisma.conversation.findMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] }, orderBy: { updatedAt: 'desc' }, include: { claim: { select: { id: true, status: true, item: { select: { id: true, title: true } } } } } });
  }

  async messages(userId: string, conversationId: string) {
    const conversation = await this.requireParticipant(userId, conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return this.prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, take: 100, select: { id: true, type: true, body: true, senderId: true, createdAt: true } });
  }

  async send(userId: string, conversationId: string, input: unknown) {
    const data = messageSchema.parse(input);
    const conversation = await this.requireParticipant(userId, conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.status !== 'OPEN') throw new BadRequestException('This conversation is read-only');
    const body = this.maskUnsafeContent(data.body);
    const recipientId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversationId, senderId: userId, body, type: 'TEXT' }, select: { id: true, type: true, body: true, senderId: true, createdAt: true } }),
      this.prisma.notification.create({ data: { userId: recipientId, type: 'NEW_MESSAGE', title: 'New message', body: 'You have a new message about your item.', data: JSON.stringify({ conversationId }) } })
    ]);
    return message;
  }

  async createForClaim(userId: string, claimId: string) {
    const claim = await this.prisma.claim.findUnique({ where: { id: claimId }, include: { item: true } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.status !== 'APPROVED' && claim.status !== 'COMPLETED') throw new BadRequestException('Chat opens after claim approval');
    if (claim.claimantId !== userId && claim.item.reporterId !== userId) throw new ForbiddenException('You are not part of this claim');
    const existing = await this.prisma.conversation.findUnique({ where: { claimId } });
    if (existing) return existing;
    return this.prisma.conversation.create({ data: { claimId, itemId: claim.itemId, userAId: claim.item.reporterId, userBId: claim.claimantId } });
  }

  private async requireParticipant(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({ where: { id: conversationId, OR: [{ userAId: userId }, { userBId: userId }] } });
    if (!conversation) throw new ForbiddenException('You are not part of this conversation');
    const otherUserId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;
    const block = await (this.prisma as any).block?.findFirst({ where: { OR: [{ blockerId: userId, blockedId: otherUserId }, { blockerId: otherUserId, blockedId: userId }] } });
    if (block) throw new ForbiddenException('This conversation is unavailable');
    return conversation;
  }

  private maskUnsafeContent(value: string) {
    return value.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[hidden for safety]').replace(/(?:https?:\/\/|www\.)\S+/gi, '[hidden for safety]').replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[hidden for safety]');
  }
}
