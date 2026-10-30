import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    refreshToken: {
      updateMany: jest.fn()
    },
    $transaction: jest.fn()
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma as never);
  });

  it('does not expose email in a public profile', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'student@students.muet.edu.pk', fullName: 'Ayesha Khan', department: 'CSE', batchYear: 2024,
      avatarUrl: null, bio: null, role: 'STUDENT', trustScore: 50, status: 'ACTIVE'
    });

    const result = await service.getPublicProfile('user-1');

    expect(result).not.toHaveProperty('email');
    expect(result.fullName).toBe('Ayesha Khan');
  });

  it('anonymizes the account and revokes refresh tokens', async () => {
    prisma.$transaction.mockResolvedValue([]);
    prisma.user.update.mockReturnValue({});
    prisma.refreshToken.updateMany.mockReturnValue({});

    await expect(service.deleteAccount('user-1')).resolves.toEqual({ success: true });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
