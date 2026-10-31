import { ClaimsService } from './claims.service';

describe('ClaimsService', () => {
  const prisma = {
    item: { findFirst: jest.fn(), update: jest.fn() },
    claim: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    $transaction: jest.fn()
  };
  const service = new ClaimsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects a claim on the claimant\'s own item', async () => {
    prisma.item.findFirst.mockResolvedValue({ id: 'item-1', reporterId: 'user-1', status: 'ACTIVE', moderationStatus: 'VISIBLE' });
    await expect(service.create('user-1', 'item-1', { message: 'Mine', answers: [{ question: 'Mark?', answer: 'Blue' }] })).rejects.toThrow('own item');
    expect(prisma.claim.create).not.toHaveBeenCalled();
  });

  it('rejects claims on unavailable items', async () => {
    prisma.item.findFirst.mockResolvedValue({ id: 'item-1', reporterId: 'finder-1', status: 'RETURNED', moderationStatus: 'VISIBLE' });
    await expect(service.create('claimant-1', 'item-1', { message: 'Mine', answers: [{ question: 'Mark?', answer: 'Blue' }] })).rejects.toThrow('not available');
  });

  it('approves only a pending claim owned by the finder', async () => {
    prisma.claim.findUnique.mockResolvedValue({ id: 'claim-1', status: 'PENDING', itemId: 'item-1', item: { reporterId: 'finder-1' } });
    await expect(service.approve('other-user', 'claim-1')).rejects.toThrow('Only the item owner');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('moves the item to claim-pending during approval', async () => {
    prisma.claim.findUnique
      .mockResolvedValueOnce({ id: 'claim-1', status: 'PENDING', itemId: 'item-1', item: { reporterId: 'finder-1' } })
      .mockResolvedValueOnce({ id: 'claim-1', status: 'PENDING' });
    prisma.$transaction.mockImplementation(async (callback: (transaction: typeof prisma) => unknown) => callback(prisma));
    prisma.claim.update.mockResolvedValue({ id: 'claim-1', status: 'APPROVED', answers: [], item: { id: 'item-1', title: 'Wallet', type: 'FOUND' } });

    await service.approve('finder-1', 'claim-1');

    expect(prisma.item.update).toHaveBeenCalledWith({ where: { id: 'item-1' }, data: { status: 'CLAIM_PENDING' } });
    expect(prisma.claim.update).toHaveBeenCalled();
  });
});
