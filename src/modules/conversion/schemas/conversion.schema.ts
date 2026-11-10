import { z } from 'zod';
import { SUPPORTED_FORMATS } from '../types/conversion.types';
import { IMAGE_FORMATS } from '../types/image-conversion.types';
import {
  BYTES_PER_KILOBYTE,
  KILOBYTES_PER_MEGABYTE,
} from '@/common/constants/file.constants';

export const conversionSchema = z.object({
  targetFormat: z.enum(SUPPORTED_FORMATS),
});

export type ConversionInput = z.infer<typeof conversionSchema>;

const MAX_FILE_SIZE_MB = 100;

export const conversionSettingsSchema = z.object({
  sourceFormat: z.enum([...SUPPORTED_FORMATS, ...IMAGE_FORMATS]),
  maxFileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE_MB * KILOBYTES_PER_MEGABYTE * BYTES_PER_KILOBYTE),
});

export type ConversionSettingsInput = z.infer<typeof conversionSettingsSchema>;
