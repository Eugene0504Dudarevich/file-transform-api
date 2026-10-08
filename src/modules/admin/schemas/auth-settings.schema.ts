import { z } from 'zod';

export const updateVerificationSchema = z.object({
  enabled: z.boolean(),
});

export type UpdateVerificationInput = z.infer<typeof updateVerificationSchema>;
