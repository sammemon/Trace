import { MatchingService } from './matching.service';

describe('MatchingService', () => {
  const prisma = {
    item: { findUnique: jest.fn(), findMany: jest.fn() },
    match: { upsert: jest.fn() },
    notification: { create: jest.fn(), createMany: jest.fn() },
    user: { findMany: jest.fn() }
  };
  const service = new MatchingService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a high-confidence match and notifies the lost-item owner', async () => {
    const lost = { id: 'lost-1', type: 'LOST', status: 'ACTIVE', reporterId: 'owner-1', categoryId: 'cat-1', color: 'blue', title: 'Blue wallet', description: 'Library card', brand: null, locationId: 'loc-1', category: {}, location: {} };
    const found = { id: 'found-1', type: 'FOUND', status: 'ACTIVE', reporterId: 'finder-1', categoryId: 'cat-1', color: 'blue', title: 'Blue wallet', description: 'Found near library', brand: null, locationId: 'loc-1', location: {} };
    prisma.item.findUnique.mockResolvedValue(lost);
    prisma.item.findMany.mockResolvedValue([found]);
    prisma.match.upsert.mockResolvedValue({ id: 'match-1', score: 100 });
    prisma.notification.create.mockResolvedValue({});

    const matches = await service.matchForItem('lost-1');

    expect(matches).toHaveLength(1);
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'owner-1', type: 'MATCH_FOUND' }) }));
  });
});