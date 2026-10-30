import { z } from 'zod';

export const roleSchema = z.enum(['STUDENT', 'MODERATOR', 'ADMIN']);
export const itemTypeSchema = z.enum(['LOST', 'FOUND']);
export const itemStatusSchema = z.enum(['ACTIVE', 'CLAIM_PENDING', 'RETURNED', 'RESOLVED', 'EXPIRED', 'REMOVED']);

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  department: z.string().trim().min(2).max(120),
  batchYear: z.number().int().min(2000).max(2100)
});

export type Role = z.infer<typeof roleSchema>;
export type ItemType = z.infer<typeof itemTypeSchema>;
export type ItemStatus = z.infer<typeof itemStatusSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const apiSuccess = <T>(data: T, meta?: Record<string, unknown>) => ({ data, ...(meta ? { meta } : {}) });
