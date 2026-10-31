import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const prisma = {
    report: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    item: { update: jest.fn() },
    auditLog: { create: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn()
  };
  const service = new ReportsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a validated report', async () => {
    prisma.report.create.mockResolvedValue({ id: 'report-1', status: 'OPEN' });
    await expect(service.create('user-1', { targetType: 'ITEM', targetId: '00000000-0000-0000-0000-000000000001', reason: 'SPAM' })).resolves.toEqual({ id: 'report-1', status: 'OPEN' });
  });

  it('writes moderation side effects when resolving an item report', async () => {
    prisma.report.findUnique.mockResolvedValue({ id: 'report-1', reporterId: 'reporter-1', targetType: 'ITEM', targetId: '00000000-0000-0000-0000-000000000001', status: 'OPEN' });
    prisma.$transaction.mockResolvedValue([{ id: 'report-1', status: 'RESOLVED' }, {}, {}]);
    await service.resolve('moderator-1', 'report-1', { action: 'HIDE_ITEM', resolutionNote: 'Removed unsafe content' });
    expect(prisma.item.update).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
