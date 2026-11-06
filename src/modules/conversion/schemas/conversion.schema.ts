import { z } from 'zod';
import { SUPPORTED_FORMATS } from '../types/conversion.types';

export const conversionSchema = z.object({
  targetFormat: z.enum(SUPPORTED_FORMATS),
});

export type ConversionInput = z.infer<typeof conversionSchema>;

export const conversionSettingsSchema = z.object({
  sourceFormat: z.enum(SUPPORTED_FORMATS),
  maxFileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024),
});

export type ConversionSettingsInput = z.infer<typeof conversionSettingsSchema>;
