import { describe, expect, it } from 'vitest';
import { registerSchema } from './index';

describe('registerSchema', () => {
  it('normalizes valid university registration input', () => {
    const result = registerSchema.parse({
      fullName: 'Ayesha Khan',
      email: 'AYESHA@STUDENTS.MUET.EDU.PK',
      password: 'strong-pass-123',
      department: 'Computer Systems Engineering',
      batchYear: 2024
    });

    expect(result.email).toBe('ayesha@students.muet.edu.pk');
  });

  it('rejects weak passwords', () => {
    const result = registerSchema.safeParse({
      fullName: 'Ayesha Khan',
      email: 'ayesha@students.muet.edu.pk',
      password: 'short',
      department: 'Computer Systems Engineering',
      batchYear: 2024
    });

    expect(result.success).toBe(false);
  });
});