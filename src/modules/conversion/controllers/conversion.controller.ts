import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ConversionService } from '../services/conversion.service';
import { ConversionSettingsService } from '../services/conversion-settings.service';
import { FileFormat, SUPPORTED_FORMATS } from '../types/conversion.types';
import { type AuthenticatedRequest } from '@/modules/auth/types/authenticated-user.type';
import { type FastifyReply } from 'fastify';
import { conversionSchema } from '../schemas/conversion.schema';
import {
  detectFormat,
  getContentType,
} from '@/modules/conversion/utils/format.utils';
import { Readable } from 'node:stream';
import {
  ApiConvertFile,
  ApiGetConversionFormats,
} from '../swagger/conversion.swagger';

@Controller('convert')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
export class ConversionController {
  constructor(
    private readonly conversionService: ConversionService,
    private readonly settings: ConversionSettingsService,
  ) {}

  @Get('formats')
  @ApiGetConversionFormats()
  getFormats() {
    return {
      formats: SUPPORTED_FORMATS,
      conversions: SUPPORTED_FORMATS.flatMap((sourceFormat) =>
        SUPPORTED_FORMATS.filter(
          (targetFormat) => targetFormat !== sourceFormat,
        ).map((targetFormat) => ({
          sourceFormat,
          targetFormat,
        })),
      ),
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiConvertFile()
  async convert(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<StreamableFile> {
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    let fileName = '';
    let targetFormat: FileFormat | undefined;
    let fileBuffer: Buffer | undefined;

    const parts = request.parts();

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'targetFormat') {
          const validation = conversionSchema.safeParse({
            targetFormat: part.value,
          });

          if (!validation.success) {
            throw new BadRequestException({
              code: 'INVALID_TARGET_FORMAT',
              message: 'Unsupported target format.',
            });
          }

          targetFormat = validation.data.targetFormat;
        }

        continue;
      }

      if (part.fieldname !== 'file') {
        part.file.resume();
        continue;
      }

      if (fileBuffer) {
        throw new BadRequestException({
          code: 'MULTIPLE_FILES_NOT_ALLOWED',
          message: 'Only one file can be uploaded.',
        });
      }

      fileName = part.filename;

      const sourceFormat = detectFormat(fileName);
      const maxFileSize = await this.settings.getMaxFileSize(sourceFormat);

      const chunks: Buffer[] = [];
      let totalSize = 0;

      for await (const chunk of part.file) {
        const buffer = Buffer.from(chunk);

        totalSize += buffer.length;

        if (totalSize > maxFileSize) {
          part.file.resume();

          throw new BadRequestException({
            code: 'FILE_TOO_LARGE',
            message:
              `Maximum file size for ${sourceFormat.toUpperCase()} ` +
              `is ${maxFileSize} bytes.`,
          });
        }

        chunks.push(buffer);
      }

      if (part.file.truncated) {
        throw new BadRequestException({
          code: 'FILE_TOO_LARGE',
          message: 'The uploaded file exceeds the multipart limit.',
        });
      }

      fileBuffer = Buffer.concat(chunks);
    }

    if (!fileBuffer || !fileName) {
      throw new BadRequestException({
        code: 'FILE_REQUIRED',
        message: 'Please upload a file.',
      });
    }

    if (!targetFormat) {
      throw new BadRequestException({
        code: 'TARGET_FORMAT_REQUIRED',
        message: 'Please provide targetFormat.',
      });
    }

    const sourceFormat = detectFormat(fileName);
    const output = await this.conversionService.convert(
      userId,
      fileName,
      fileBuffer,
      sourceFormat,
      targetFormat,
    );

    reply.header('Content-Type', getContentType(targetFormat));
    reply.header(
      'Content-Disposition',
      `attachment; filename="converted.${targetFormat}"`,
    );
    reply.header('Content-Length', output.length);

    return new StreamableFile(Readable.from([output]));
  }
}
