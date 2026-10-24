import { z } from 'zod';

const photoSchema = z.union([
  z.url(),
  z
    .string()
    .regex(
      /^\/uploads\/[A-Za-z0-9/_-]+(?:\.[A-Za-z0-9]+)?$/,
      'Photo must be a valid URL or an uploads path',
    ),
  z.null(),
]);

export const updateUserParamsSchema = z.object({
  userId: z.uuid(),
});

export const updateUserSchema = z
  .object({
    email: z.email().trim().toLowerCase().optional(),
    photo: photoSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdatedUserInput = z.infer<typeof updateUserSchema>;
