import { z } from 'zod';

export const creteRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Role name is required')
    .max(100, 'Role name must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters'),
});

export const updateRoleSchema = creteRoleSchema.partial();

export type CreateRoleInput = z.infer<typeof creteRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
