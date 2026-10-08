import { z } from 'zod';

export const verifyLoginSchema = z.object({
  attemptId: z.string(),
  otpCode: z
    .string()
    .regex(/^\d{6}$/, 'OTP code must contain exactly 6 digits'),
});

export type VerifyLoginInput = z.infer<typeof verifyLoginSchema>;
