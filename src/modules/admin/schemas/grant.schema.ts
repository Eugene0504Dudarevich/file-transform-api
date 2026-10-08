import { z } from 'zod';
import { RBAC_ACTIONS } from '../../rbac/constants/rbac.constants.js';

export const createGrantSchema = z.object({
  roleId: z.string().min(1, 'Role id is required'),
  permissionId: z.string().min(1, 'Permission id is required'),
  actions: z
    .array(z.enum(RBAC_ACTIONS))
    .refine(
      (actions) => new Set(actions).size === actions.length,
      'Actions must be unique',
    )
    .optional(),
});

export const updateGrantSchema = z.object({
  actions: z
    .array(z.enum(RBAC_ACTIONS))
    .refine(
      (actions) => new Set(actions).size === actions.length,
      'Actions must be unique',
    )
    .optional(),
});

export type CreateGrantInput = z.infer<typeof createGrantSchema>;
export type UpdateGrantInput = z.infer<typeof updateGrantSchema>;
