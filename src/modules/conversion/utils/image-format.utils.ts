import { extname } from 'node:path';
import {
  ImageFormat,
  RasterImageFormat,
} from '../types/image-conversion.types';
import { UnsupportedMediaTypeException } from '@nestjs/common';

export const detectImageFormat = (fileName: string): ImageFormat => {
  const extension = extname(fileName).toLowerCase();
  const formats: Record<string, ImageFormat> = {
    '.png': 'png',
    '.jpg': 'jpeg',
    '.jpeg': 'jpeg',
    '.svg': 'svg',
  };
  const format = formats[extension];

  if (!format) {
    throw new UnsupportedMediaTypeException({
      code: 'UNSUPPORTED_SOURCE_FORMAT',
      message: `Unsupported image format: ${extension || 'unknown'}.`,
    });
  }

  return format;
};

export const getImageContentType = (format: RasterImageFormat): string => {
  const contentTypes: Record<RasterImageFormat, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
  };

  return contentTypes[format];
};
