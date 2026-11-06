import { FileFormat } from '../types/conversion.types';

export const MAX_STRUCTURE_DEPTH = 50;
export const MAX_STRUCTURE_NODES = 100_000;

export const BYTES_PER_KILOBYTE = 1024;
export const KILOBYTES_PER_MEGABYTE = 1024;
export const DEFAULT_MAX_FILE_SIZE_MB = 5;

export const DEFAULT_MAX_FILE_SIZE_BYTES =
  DEFAULT_MAX_FILE_SIZE_MB * KILOBYTES_PER_MEGABYTE * BYTES_PER_KILOBYTE;

export const DEFAULT_LIMITS: Record<FileFormat, number> = {
  csv: DEFAULT_MAX_FILE_SIZE_BYTES,
  json: DEFAULT_MAX_FILE_SIZE_BYTES,
  xml: DEFAULT_MAX_FILE_SIZE_BYTES,
  yaml: DEFAULT_MAX_FILE_SIZE_BYTES,
};
