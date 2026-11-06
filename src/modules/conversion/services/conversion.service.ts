import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { FormatConverterService } from './format-converter.service';
import { ConversionSettingsService } from './conversion-settings.service';
import { FileFormat } from '../types/conversion.types';
import { isRecord } from '../utils/conversion.utils';

@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);

  constructor(
    private readonly converter: FormatConverterService,
    private readonly prisma: PrismaService,
    private readonly settings: ConversionSettingsService,
  ) {}

  async convert(
    userId: string,
    fileName: string,
    input: Buffer,
    sourceFormat: FileFormat,
    targetFormat: FileFormat,
  ): Promise<Buffer> {
    const startedAt = Date.now();
    let success = false;
    let errorCode: string | null = null;

    try {
      const maxFileSize = await this.settings.getMaxFileSize(sourceFormat);

      if (!input.length) {
        throw new BadRequestException({
          code: 'EMPTY_FILE',
          message: 'The uploaded file is empty.',
        });
      }

      if (input.length > maxFileSize) {
        throw new BadRequestException({
          code: 'FILE_TOO_LARGE',
          message: `Maximum file size for ${sourceFormat.toUpperCase()} is ${maxFileSize} bytes.`,
        });
      }

      if (sourceFormat === targetFormat) {
        throw new BadRequestException({
          code: 'SAME_FORMAT',
          message: 'Source and target formats must be different.',
        });
      }

      const result = this.converter.convert(input, sourceFormat, targetFormat);
      success = true;

      return result;
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
          `Failed to save conversion audit record for user ${userId}`,
          error instanceof Error ? error.stack : undefined,
        );
      }

      this.logger.log(
        `Conversion ${success ? 'succeeded' : 'failed'}: ` +
          `${sourceFormat} -> ${targetFormat}, ` +
          `user=${userId}, duration=${durationMs}ms`,
      );
    }
  }
}
