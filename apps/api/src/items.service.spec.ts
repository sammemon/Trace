import { ItemsService } from './items.service';

describe('ItemsService', () => {
  const prisma = {
    category: { findFirst: jest.fn() },
    campusLocation: { findFirst: jest.fn() },
    item: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() }
  };
  let service: ItemsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ItemsService(prisma as never);
  });

  it('rejects item creation when reference data is inactive', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    prisma.campusLocation.findFirst.mockResolvedValue({ id: 'location-1' });

    await expect(service.create('user-1', {
      type: 'FOUND', title: 'Blue wallet', description: 'Found near the library', categoryId: '00000000-0000-0000-0000-000000000001', locationId: '00000000-0000-0000-0000-000000000002', occurredAt: new Date().toISOString()
    })).rejects.toThrow('Category or location');
  });

  it('maps public item data without private fields', async () => {
    prisma.item.findFirst.mockResolvedValue({
      id: 'item-1', type: 'FOUND', title: 'Blue wallet', description: 'Found near the library', category: { id: 'category-1', name: 'Wallet', slug: 'wallet', icon: 'wallet', isSensitive: false }, location: { id: 'location-1', name: 'Library', type: 'LIBRARY', lat: 24.86, lng: 67 }, reporter: { id: 'user-1', fullName: 'Ayesha', avatarUrl: null, department: 'CSE', trustScore: 50 }, color: 'blue', brand: null, tags: [], locationNote: null, occurredAt: new Date(), isTimeApproximate: false, status: 'ACTIVE', viewCount: 0, expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date(), privateDetailsEnc: 'never-return'
    });

    const result = await service.getOne('item-1');

    expect(result).not.toHaveProperty('privateDetailsEnc');
    expect(result.title).toBe('Blue wallet');
  });
});