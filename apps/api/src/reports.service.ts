import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { reportSchema, resolveReportSchema } from '@trace/shared';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, input: unknown) {
    const data = reportSchema.parse(input);
    return this.prisma.report.create({ data: { reporterId, ...data }, select: { id: true, targetType: true, targetId: true, reason: true, details: true, status: true, createdAt: true } });
  }

  async mine(reporterId: string) {
    return this.prisma.report.findMany({ where: { reporterId }, orderBy: { createdAt: 'desc' }, select: { id: true, targetType: true, targetId: true, reason: true, details: true, status: true, resolutionNote: true, createdAt: true } });
  }

  async queue() {
    return this.prisma.report.findMany({ where: { status: 'OPEN' }, orderBy: { createdAt: 'asc' }, take: 100, include: { reporter: { select: { id: true, fullName: true, department: true } } } });
  }

  async resolve(actorId: string, reportId: string, input: unknown) {
    const data = resolveReportSchema.parse(input);
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report || report.status !== 'OPEN') throw new NotFoundException('Open report not found');
    if (data.action === 'HIDE_ITEM' || data.action === 'REMOVE_ITEM') {
      if (report.targetType !== 'ITEM') throw new BadRequestException('Item actions require an item report');
      await this.prisma.item.update({ where: { id: report.targetId }, data: { moderationStatus: data.action === 'HIDE_ITEM' ? 'HIDDEN' : 'HIDDEN', status: data.action === 'REMOVE_ITEM' ? 'REMOVED' : undefined } });
    }
    const status = data.action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';
    const [updated] = await this.prisma.$transaction([
      this.prisma.report.update({ where: { id: reportId }, data: { status, handledById: actorId, resolutionNote: data.resolutionNote, resolvedAt: new Date() } }),
      this.prisma.auditLog.create({ data: { actorId, action: data.action, targetType: report.targetType, targetId: report.targetId, metadata: JSON.stringify({ reportId, resolutionNote: data.resolutionNote }) } }),
      this.prisma.notification.create({ data: { userId: report.reporterId, type: 'REPORT_UPDATE', title: 'Report updated', body: 'A moderator reviewed your report.', data: JSON.stringify({ reportId }) } })
    ]);
    return updated;
  }
}
