import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as argon2 from 'argon2';
import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { changePasswordSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from '@trace/shared';

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  department: string;
  batchYear: number;
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN';
  trustScore: number;
};

export type AccessClaims = JwtPayload & {
  sub: string;
  email: string;
  role: AuthUser['role'];
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: unknown) {
    const data = registerSchema.parse(input);
    this.assertAllowedEmail(data.email);

    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException('Unable to register with these details');
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await argon2.hash(data.password, { type: argon2.argon2id }),
        fullName: data.fullName,
        department: data.department,
        batchYear: data.batchYear,
        ...(data.studentId ? { studentIdHash: this.hashStudentId(data.studentId) } : {})
      }
    });
    const code = await this.createOtp(user.id, user.email, 'VERIFY_EMAIL');

    return {
      user: this.toAuthUser(user),
      verificationRequired: true,
      ...(process.env.NODE_ENV !== 'production' ? { devVerificationCode: '000000' } : {})
    };
  }

  async verifyEmail(input: unknown) {
    const data = verifyEmailSchema.parse(input);
    const otp = await this.prisma.otpCode.findFirst({
      where: { email: data.email, purpose: 'VERIFY_EMAIL', consumedAt: null },
      orderBy: { createdAt: 'desc' }
    });
    if (!otp || otp.expiresAt <= new Date() || otp.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException('The verification code is invalid or expired');
    }

    if (!this.constantTimeEqual(otp.codeHash, this.hashCode(data.code))) {
      // Allow universal dev code '000000' in development
      if (process.env.NODE_ENV !== 'production' && data.code === '000000') {
        // bypass hash check
      } else {
        await this.prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
        throw new BadRequestException('The verification code is invalid or expired');
      }
    }

    const user = await this.prisma.user.update({
      where: { email: data.email },
      data: { emailVerifiedAt: new Date() }
    });
    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    return this.issueSession(this.toAuthUser(user));
  }

  async resendVerification(input: unknown) {
    const data = verifyEmailSchema.pick({ email: true }).parse(input);
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user || user.emailVerifiedAt) return { verificationRequired: true };
    const recent = await this.prisma.otpCode.findFirst({ where: { email: data.email, purpose: 'VERIFY_EMAIL' }, orderBy: { createdAt: 'desc' } });
    if (recent && recent.createdAt.getTime() > Date.now() - 60_000) throw new BadRequestException('Please wait before requesting another code');
    const code = await this.createOtp(user.id, user.email, 'VERIFY_EMAIL');
    return { verificationRequired: true, ...(process.env.NODE_ENV !== 'production' ? { devVerificationCode: '000000' } : {}) };
  }

  async forgotPassword(input: unknown) {
    const data = verifyEmailSchema.pick({ email: true }).parse(input);
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (user) {
      const code = await this.createOtp(user.id, user.email, 'RESET_PASSWORD');
      if (process.env.NODE_ENV !== 'production') return { accepted: true, devResetCode: '000000' };
    }
    return { accepted: true };
  }

  async resetPassword(input: unknown) {
    const data = resetPasswordSchema.parse(input);
    const otp = await this.prisma.otpCode.findFirst({ where: { email: data.email, purpose: 'RESET_PASSWORD', consumedAt: null }, orderBy: { createdAt: 'desc' } });
    if (!otp || otp.expiresAt <= new Date() || otp.attempts >= MAX_OTP_ATTEMPTS || (!this.constantTimeEqual(otp.codeHash, this.hashCode(data.code)) && !(process.env.NODE_ENV !== 'production' && data.code === '000000'))) {
      throw new BadRequestException('The reset code is invalid or expired');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { email: data.email }, data: { passwordHash: await argon2.hash(data.password, { type: argon2.argon2id }) } }),
      this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
      this.prisma.refreshToken.updateMany({ where: { user: { email: data.email }, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
    return { success: true };
  }

  async changePassword(userId: string, input: unknown) {
    const data = changePasswordSchema.parse(input);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await argon2.verify(user.passwordHash, data.currentPassword))) throw new UnauthorizedException('Current password is incorrect');
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(data.newPassword, { type: argon2.argon2id }) } });
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  async login(input: unknown) {
    const data = loginSchema.parse(input);
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await argon2.verify(user.passwordHash, data.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Email verification required');
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account restricted');
    }
    return this.issueSession(this.toAuthUser(user));
  }

  async refresh(input: unknown) {
    const data = refreshSchema.parse(input);
    const tokenHash = this.hashToken(data.refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
      if (stored) {
        await this.prisma.refreshToken.updateMany({ where: { familyId: stored.familyId }, data: { revokedAt: new Date() } });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = this.toAuthUser(stored.user);
    const replacement = this.createRefreshToken();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date(), replacedBy: replacement.id } });
      await transaction.refreshToken.create({
        data: {
          id: replacement.id,
          userId: user.id,
          familyId: stored.familyId,
          tokenHash: replacement.hash,
          expiresAt: replacement.expiresAt
        }
      });
    });

    return { accessToken: this.createAccessToken(user), refreshToken: replacement.raw, user };
  }

  async logout(refreshToken: unknown) {
    const data = refreshSchema.parse(refreshToken);
    await this.prisma.refreshToken.updateMany({ where: { tokenHash: this.hashToken(data.refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account restricted');
    }
    return this.toAuthUser(user);
  }

  verifyAccessToken(token: string): AccessClaims {
    try {
      return jwt.verify(token, this.getSecret()) as AccessClaims;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private async createOtp(userId: string, email: string, purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD') {
    const code = randomInt(100000, 1000000).toString();
    await this.prisma.otpCode.create({
      data: {
        userId,
        email,
        codeHash: this.hashCode(code),
        purpose,
        expiresAt: new Date(Date.now() + OTP_TTL_MS)
      }
    });
    return code;
  }

  private issueSession(user: AuthUser) {
    const refresh = this.createRefreshToken();
    return this.prisma.refreshToken.create({
      data: {
        id: refresh.id,
        userId: user.id,
        familyId: refresh.familyId,
        tokenHash: refresh.hash,
        expiresAt: refresh.expiresAt
      }
    }).then(() => ({ accessToken: this.createAccessToken(user), refreshToken: refresh.raw, user }));
  }

  private createRefreshToken() {
    const raw = randomBytes(48).toString('base64url');
    return {
      id: randomUUID(),
      familyId: randomUUID(),
      raw,
      hash: this.hashToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
    };
  }

  private createAccessToken(user: AuthUser) {
    return jwt.sign({ sub: user.id, email: user.email, role: user.role }, this.getSecret(), { expiresIn: ACCESS_TTL_SECONDS });
  }

  private toAuthUser(user: { id: string; email: string; fullName: string; department: string; batchYear: number; role: 'STUDENT' | 'MODERATOR' | 'ADMIN'; trustScore: number }): AuthUser {
    return { id: user.id, email: user.email, fullName: user.fullName, department: user.department, batchYear: user.batchYear, role: user.role, trustScore: user.trustScore };
  }

  private assertAllowedEmail(email: string) {
    const domains = (process.env.ALLOWED_EMAIL_DOMAINS ?? '').split(',').map((domain) => domain.trim().toLowerCase()).filter(Boolean);
    if (!domains.includes(email.split('@')[1] ?? '')) {
      throw new BadRequestException('Use an approved university email address');
    }
  }

  private getSecret() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
    }
    return secret;
  }

  private hashCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashStudentId(studentId: string) {
    const secret = process.env.STUDENT_ID_HMAC_SECRET;
    if (!secret || secret.length < 16) throw new Error('STUDENT_ID_HMAC_SECRET must be configured');
    return createHmac('sha256', secret).update(studentId.trim().toLowerCase()).digest('hex');
  }

  private constantTimeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }
}
