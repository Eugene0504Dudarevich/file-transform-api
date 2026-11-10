import { ImageFormat } from '../types/image-conversion.types';
import {
  BYTES_PER_KILOBYTE,
  DEFAULT_MAX_FILE_SIZE_BYTES,
  KILOBYTES_PER_MEGABYTE,
} from '@/common/constants/file.constants';

export const DEFAULT_IMAGES_LIMITS: Record<ImageFormat, number> = {
  png: DEFAULT_MAX_FILE_SIZE_BYTES,
  jpeg: DEFAULT_MAX_FILE_SIZE_BYTES,
  svg: DEFAULT_MAX_FILE_SIZE_BYTES,
};

const BYTES_PER_MB = BYTES_PER_KILOBYTE * KILOBYTES_PER_MEGABYTE;

export const MAX_IMAGE_FILE_SIZE_BYTES = 100 * BYTES_PER_MB;

export const MAX_IMAGE_DIMENSION = 4096;

export const MAX_IMAGE_PIXELS = MAX_IMAGE_DIMENSION * MAX_IMAGE_DIMENSION;

export const MAX_SVG_FILE_SIZES_BYTES = DEFAULT_MAX_FILE_SIZE_BYTES;

export const DEFAULT_JPEG_QUALITY = 85;

export const DEFAULT_SVG_BACKGROUND = '#ffffff';
