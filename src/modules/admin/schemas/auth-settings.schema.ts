import { z } from 'zod';

export const updateRegistrationVerificationSchema = z.object({
  enabled: z.boolean(),
});

export type UpdateRegistrationVerificationInput = z.infer<
  typeof updateRegistrationVerificationSchema
>;
