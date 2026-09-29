import { z } from 'zod';

export const verifyRegistrationSchema = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/),
});

export type VerifyRegistrationInput = z.infer<typeof verifyRegistrationSchema>;
