import { z } from 'zod';

export const emailChangeParamsSchema = z.object({
  userId: z.uuid(),
});

export const initiateEmailChangeSchema = z
  .object({
    newEmail: z.email().trim().toLowerCase(),
  })
  .strict();

export const confirmEmailChangeSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, 'OTP code must contain exactly 6 digits'),
  })
  .strict();

export type InitiateEmailChangeInput = z.infer<
  typeof initiateEmailChangeSchema
>;

export type ConfirmEmailChangeInput = z.infer<typeof confirmEmailChangeSchema>;
