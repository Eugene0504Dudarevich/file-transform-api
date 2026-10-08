import { z } from 'zod';
import { RBAC_ACTIONS } from '../../rbac/constants/rbac.constants.js';

export const createPermissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Permission name is required')
    .max(100, 'Permission name must not exceed 100 characters'),
  actions: z
    .array(z.enum(RBAC_ACTIONS))
    .min(1, 'At least one action is required')
    .refine(
      (actions) => new Set(actions).size === actions.length,
      'Actions must be unique',
    ),
});

export const updatePermissionSchema = createPermissionSchema.partial();

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
