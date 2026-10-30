import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { deviceTokenSchema, notificationPreferencesSchema, updateProfileSchema } from '@trace/shared';
import { PrismaService } from './prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, input: unknown) {
    const data = updateProfileSchema.parse(input);
    const user = await this.prisma.user.update({ where: { id: userId }, data });
    return this.toPrivateProfile(user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === 'DELETED') throw new NotFoundException('User not found');
    return this.toPrivateProfile(user);
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === 'DELETED') throw new NotFoundException('User not found');
    return { id: user.id, fullName: user.fullName, department: user.department, batchYear: user.batchYear, avatarUrl: user.avatarUrl, bio: user.bio, role: user.role, trustScore: user.trustScore };
  }

  async deleteAccount(userId: string) {
    const anonymizedEmail = `deleted-${userId}@deleted.invalid`;
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { email: anonymizedEmail, fullName: 'Deleted user', department: 'Deleted', batchYear: 2000, passwordHash: 'deleted', studentIdHash: null, avatarUrl: null, bio: null, status: 'DELETED', deletedAt: new Date(), notificationPrefs: {}, quietHours: Prisma.JsonNull }
      }),
      this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
    return { success: true };
  }

  async registerDeviceToken(userId: string, input: unknown) {
    const data = deviceTokenSchema.parse(input);
    await this.prisma.deviceToken.upsert({ where: { expoPushToken: data.expoPushToken }, create: { ...data, userId }, update: { userId, platform: data.platform, appVersion: data.appVersion, lastActiveAt: new Date() } });
    return { success: true };
  }

  async removeDeviceToken(userId: string, token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { userId, expoPushToken: token } });
    return { success: true };
  }

  async updateNotificationPreferences(userId: string, input: unknown) {
    const data = notificationPreferencesSchema.parse(input);
    const current = await this.prisma.user.findUnique({ where: { id: userId }, select: { notificationPrefs: true, quietHours: true } });
    if (!current) throw new NotFoundException('User not found');
    const { quietHoursStart, quietHoursEnd, ...preferences } = data;
    const currentPreferences = (current.notificationPrefs as Record<string, unknown>) ?? {};
    const currentQuietHours = (current.quietHours as Record<string, unknown>) ?? {};
    const user = await this.prisma.user.update({ where: { id: userId }, data: { notificationPrefs: { ...currentPreferences, ...preferences }, quietHours: { ...currentQuietHours, ...(quietHoursStart !== undefined ? { start: quietHoursStart } : {}), ...(quietHoursEnd !== undefined ? { end: quietHoursEnd } : {}) } } });
    return { notificationPrefs: user.notificationPrefs, quietHours: user.quietHours };
  }

  private toPrivateProfile(user: any) {
    return { id: user.id, email: user.email, fullName: user.fullName, department: user.department, batchYear: user.batchYear, avatarUrl: user.avatarUrl, bio: user.bio, role: user.role, status: user.status, trustScore: user.trustScore, notificationPrefs: user.notificationPrefs, quietHours: user.quietHours, locale: user.locale };
  }
}