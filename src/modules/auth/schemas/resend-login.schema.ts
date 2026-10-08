import { z } from 'zod';

export const resendLoginSchema = z.object({
  attemptId: z.string(),
});

export type ResendLoginInput = z.infer<typeof resendLoginSchema>;
