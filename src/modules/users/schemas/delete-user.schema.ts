import { z } from 'zod';
import { userIdParamsSchema } from './user-params.schema';

export const requestAccountDeletionSchema = z.object({});

export const confirmAccountDeletionSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must contain 6 digits'),
});

export type DeleteUserParams = z.infer<typeof userIdParamsSchema>;

export type ConfirmAccountDeletionInput = z.infer<
  typeof confirmAccountDeletionSchema
>;
