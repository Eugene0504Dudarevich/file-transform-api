import { z } from 'zod';

export const userListQuerySchema = z
  .object({
    cursor: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().min(1).max(255).optional(),
    status: z.enum(['pending', 'active', 'blocked']).optional(),
    sort: z.enum(['created_at', 'last_login', 'email']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

export type UserListQuery = z.infer<typeof userListQuerySchema>;