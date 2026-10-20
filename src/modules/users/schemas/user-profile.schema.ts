import { z } from 'zod';

export const userProfileSchema = z.object({
  userId: z.uuid(),
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;
