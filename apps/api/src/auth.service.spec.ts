import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    email: '23cs066@students.muet.edu.pk',
    passwordHash: '',
    fullName: 'Ayesha Khan',
    department: 'CSE',
    batchYear: 2024,
    role: 'STUDENT' as const,
    status: 'ACTIVE' as const,
    emailVerifiedAt: new Date(),
    trustScore: 50
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    otpCode: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn()
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    $transaction: jest.fn()
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.ALLOWED_EMAIL_DOMAINS = 'students.muet.edu.pk';
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    service = new AuthService(prisma as never);
  });

  it('rejects registration outside the university allow-list', async () => {
    await expect(service.register({
      fullName: 'Ayesha Khan',
      email: 'ayesha@example.com',
      password: 'strong-pass-123',
      department: 'CSE',
      batchYear: 2024
    })).rejects.toThrow('approved university email');
  });

  it('creates a hashed password and development OTP for an approved registration', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({ ...user, ...data }));
    prisma.otpCode.create.mockResolvedValue({});

    const result = await service.register({
      fullName: 'Ayesha Khan',
      email: user.email,
      password: 'strong-pass-123',
      department: 'CSE',
      batchYear: 2024
    });

    expect(result.devVerificationCode).toMatch(/^\d{6}$/);
    expect(prisma.user.create.mock.calls[0][0].data.passwordHash).not.toBe('strong-pass-123');
    await expect(argon2.verify(prisma.user.create.mock.calls[0][0].data.passwordHash, 'strong-pass-123')).resolves.toBe(true);
  });

  it('rejects an invalid OTP and increments attempts', async () => {
    prisma.otpCode.findFirst.mockResolvedValue({ id: 'otp-1', codeHash: 'wrong', attempts: 0, expiresAt: new Date(Date.now() + 60_000) });

    await expect(service.verifyEmail({ email: user.email, code: '123456' })).rejects.toThrow('invalid or expired');
    expect(prisma.otpCode.update).toHaveBeenCalledWith({ where: { id: 'otp-1' }, data: { attempts: { increment: 1 } } });
  });
});