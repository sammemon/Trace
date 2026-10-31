import { z } from 'zod';

export const roleSchema = z.enum(['STUDENT', 'MODERATOR', 'ADMIN']);
export const itemTypeSchema = z.enum(['LOST', 'FOUND']);
export const itemStatusSchema = z.enum(['ACTIVE', 'CLAIM_PENDING', 'RETURNED', 'RESOLVED', 'EXPIRED', 'REMOVED']);
export const claimStatusSchema = z.enum(['PENDING', 'MORE_INFO_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'COMPLETED']);
export const otpPurposeSchema = z.enum(['VERIFY_EMAIL', 'RESET_PASSWORD']);

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  department: z.string().trim().min(2).max(120),
  batchYear: z.number().int().min(2000).max(2100)
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/)
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(32).max(512)
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(128)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128)
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  department: z.string().trim().min(2).max(120).optional(),
  batchYear: z.number().int().min(2000).max(2100).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  avatarUrl: z.string().url().max(500).nullable().optional()
});

export const deviceTokenSchema = z.object({
  expoPushToken: z.string().min(10).max(500),
  platform: z.enum(['ios', 'android', 'web']),
  appVersion: z.string().max(40).optional()
});

export const notificationPreferencesSchema = z.object({
  masterEnabled: z.boolean().optional(),
  claims: z.boolean().optional(),
  messages: z.boolean().optional(),
  matches: z.boolean().optional(),
  announcements: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional()
});

export const createItemSchema = z.object({
  type: itemTypeSchema,
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(3).max(1000),
  categoryId: z.string().uuid(),
  locationId: z.string().uuid(),
  color: z.string().trim().max(40).optional(),
  brand: z.string().trim().max(80).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  locationNote: z.string().trim().max(240).optional(),
  occurredAt: z.coerce.date().refine((date) => date <= new Date(), 'Date cannot be in the future'),
  isTimeApproximate: z.boolean().default(false)
});

export const updateItemSchema = createItemSchema.partial();

export const itemQuerySchema = z.object({
  type: itemTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  status: itemStatusSchema.default('ACTIVE'),
  search: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional()
});

export const savedSearchSchema = z.object({
  query: z.string().trim().max(100).default(''),
  filters: itemQuerySchema.partial().default({}),
  notify: z.boolean().default(true)
});

export const createClaimSchema = z.object({
  message: z.string().trim().min(1).max(500),
  answers: z.array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(1000) })).min(1).max(3)
});

export const rejectClaimSchema = z.object({
  reason: z.enum(['ANSWER_UNCLEAR', 'NOT_ENOUGH_PROOF', 'INCORRECT_ITEM', 'OTHER'])
});

export const handoverCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/)
});

export const messageSchema = z.object({
  body: z.string().trim().min(1).max(2000)
});

export const reportSchema = z.object({
  targetType: z.enum(['ITEM', 'USER', 'MESSAGE', 'CLAIM']),
  targetId: z.string().uuid(),
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'SCAM', 'HARASSMENT', 'WRONG_INFO', 'OTHER']),
  details: z.string().trim().max(1000).optional()
});

export const resolveReportSchema = z.object({
  action: z.enum(['DISMISS', 'HIDE_ITEM', 'REMOVE_ITEM', 'WARN_USER']),
  resolutionNote: z.string().trim().min(1).max(1000)
});

export const presignUploadSchema = z.object({
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().min(1).max(5 * 1024 * 1024),
  fileName: z.string().trim().min(1).max(200)
});

export const confirmUploadSchema = z.object({
  itemId: z.string().uuid(),
  objectKey: z.string().min(10).max(500),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().min(1).max(5 * 1024 * 1024),
  position: z.number().int().min(0).max(4).optional(),
  isCover: z.boolean().optional()
});

export type Role = z.infer<typeof roleSchema>;
export type ItemType = z.infer<typeof itemTypeSchema>;
export type ItemStatus = z.infer<typeof itemStatusSchema>;
export type ClaimStatus = z.infer<typeof claimStatusSchema>;
export type OtpPurpose = z.infer<typeof otpPurposeSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const apiSuccess = <T>(data: T, meta?: Record<string, unknown>) => ({ data, ...(meta ? { meta } : {}) });
