import { z } from 'zod';

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
});

export type UserIdParam = z.infer<typeof userIdParamsSchema>;
