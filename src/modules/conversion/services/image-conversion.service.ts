import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ImageConverterService } from './image-converter.service';
import { PrismaService } from '@/core/database/prisma.service';
import {
  ImageFormat,
  RasterImageFormat,
} from '../types/image-conversion.types';
import { ImageConversionOptions } from '../schemas/image-conversion.schema';
import { isRecord } from '@/modules/conversion/utils/conversion.utils';

@Injectable()
export class ImageConversionService {
  private readonly logger = new Logger(ImageConversionService.name);

  constructor(
    private readonly converter: ImageConverterService,
    private readonly prisma: PrismaService,
  ) {}

  async convert(
    userId: string,
    input: Buffer,
    sourceFormat: ImageFormat,
    targetFormat: RasterImageFormat,
    options: ImageConversionOptions,
  ): Promise<Buffer> {
    const startedAt = Date.now();
    let success = false;
    let errorCode: string | null = null;

    try {
      const output = await this.converter.convert(
        input,
        sourceFormat,
        targetFormat,
        options,
      );

      success = true;

      return output;
    } catch (error: unknown) {
      const response =
        error instanceof HttpException ? error.getResponse() : null;
      const responseBody = isRecord(response) ? response : null;

      errorCode =
        typeof responseBody?.code === 'string'
          ? responseBody.code
          : 'CONVERSION_FAILED';

      throw error;
    } finally {
      const durationMs = Date.now() - startedAt;

      try {
        await this.prisma.conversionAudit.create({
          data: {
            userId,
            sourceFormat,
            targetFormat,
            fileSize: input.length,
            success,
            errorCode,
            durationMs,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to save image conversion for user ${userId}`,
          error instanceof Error ? error.stack : undefined,
        );
      }

      this.logger.log(
        `Image conversion ${success ? 'succeeded' : 'failed'}: ` +
          `${sourceFormat} -> ${targetFormat},` +
          `user=${userId}, duration=${durationMs}ms`,
      );
    }
  }
}
