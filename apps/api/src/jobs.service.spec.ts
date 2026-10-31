import { JobsService } from './jobs.service';

describe('JobsService', () => {
  const prisma = {
    claim: { updateMany: jest.fn() },
    item: { updateMany: jest.fn(), findMany: jest.fn() },
    notification: { createMany: jest.fn() }
  };
  const service = new JobsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('expires pending claims past their deadline', async () => {
    prisma.claim.updateMany.mockResolvedValue({ count: 2 });
    await service.expireClaims();
    expect(prisma.claim.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'EXPIRED' } }));
  });

  it('expires active items past their deadline', async () => {
    prisma.item.updateMany.mockResolvedValue({ count: 1 });
    await service.expireItems();
    expect(prisma.item.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'EXPIRED' } }));
  });

  it('notifies owners of soon-expiring items', async () => {
    prisma.item.findMany.mockResolvedValue([{ id: 'item-1', title: 'Wallet', reporterId: 'user-1', expiresAt: new Date() }]);
    prisma.notification.createMany.mockResolvedValue({ count: 1 });
    await service.notifyExpiringItems();
    expect(prisma.notification.createMany).toHaveBeenCalled();
  });
});
