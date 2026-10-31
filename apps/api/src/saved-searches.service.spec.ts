import { SavedSearchesService } from './saved-searches.service';

describe('SavedSearchesService', () => {
  const prisma = {
    savedSearch: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn()
    }
  };
  const service = new SavedSearchesService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a normalized saved search for the current user', async () => {
    prisma.savedSearch.create.mockResolvedValue({ id: 'search-1', query: 'blue wallet', filters: {}, notify: true });
    const result = await service.create('user-1', { query: ' blue wallet ', notify: true });
    expect(prisma.savedSearch.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1', query: 'blue wallet' }) }));
    expect(result.id).toBe('search-1');
  });

  it('cannot delete another user\'s saved search', async () => {
    prisma.savedSearch.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('user-1', 'search-1')).rejects.toThrow('Saved search not found');
  });
});
