import { z } from 'zod';
import { MAX_IMAGE_DIMENSION } from '../constants/image-conversion.constants';
import { IMAGE_TARGET_FORMATS } from '../types/image-conversion.types';

export const imageConversionOptionsSchema = z
  .object({
    quality: z.number().int().min(1).max(100).optional(),
    width: z.number().int().positive().max(MAX_IMAGE_DIMENSION).optional(),
    height: z.number().int().positive().max(MAX_IMAGE_DIMENSION).optional(),
    background: z
      .string()
      .regex(/^#[0-9a-fA-F]{3,8}$/)
      .optional(),
  })
  .strict();

export const imageConversionSchema = z.object({
  targetFormat: z.enum(IMAGE_TARGET_FORMATS),
  options: imageConversionOptionsSchema.optional(),
});

export type ImageConversionInput = z.infer<typeof imageConversionSchema>;

export type ImageConversionOptions = z.infer<
  typeof imageConversionOptionsSchema
>;
