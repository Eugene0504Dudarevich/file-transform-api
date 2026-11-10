import { FileFormat } from '../types/conversion.types';
import { DEFAULT_MAX_FILE_SIZE_BYTES } from '@/common/constants/file.constants';

export const MAX_STRUCTURE_DEPTH = 50;
export const MAX_STRUCTURE_NODES = 100_000;

export const DEFAULT_LIMITS: Record<FileFormat, number> = {
  csv: DEFAULT_MAX_FILE_SIZE_BYTES,
  json: DEFAULT_MAX_FILE_SIZE_BYTES,
  xml: DEFAULT_MAX_FILE_SIZE_BYTES,
  yaml: DEFAULT_MAX_FILE_SIZE_BYTES,
};
