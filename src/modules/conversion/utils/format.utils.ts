import { extname } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { FileFormat, SUPPORTED_FORMATS } from '../types/conversion.types';

export const detectFormat = (fileName: string): FileFormat => {
  const extension = extname(fileName).replace('.', '').toLowerCase();

  if (!SUPPORTED_FORMATS.includes(extension as FileFormat)) {
    throw new BadRequestException({
      code: 'UNSUPPORTED_SOURCE_FORMAT',
      message: `Unsupported file format: ${extension || 'unknown'}`,
    });
  }

  return extension as FileFormat;
};

export const getContentType = (format: FileFormat): string => {
  const contentTypes: Record<FileFormat, string> = {
    csv: 'text/csv; charset=utf-8',
    json: 'application/json; charset=utf-8',
    xml: 'application/xml; charset=utf-8',
    yaml: 'application/yaml; charset=utf-8',
  };

  return contentTypes[format];
};
