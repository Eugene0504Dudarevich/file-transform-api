import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  PayloadTooLargeException,
  Post,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import { type FastifyReply } from 'fastify';
import { ImageConversionService } from '../services/image-conversion.service';
import { ConversionSettingsService } from '../services/conversion-settings.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { type AuthenticatedRequest } from '@/modules/auth/types/authenticated-user.type';
import { IMAGE_CONVERSIONS } from '../types/image-conversion.types';
import {
  detectImageFormat,
  getImageContentType,
} from '../utils/image-format.utils';
import { ApiCookieAuth } from '@nestjs/swagger';
import { imageConversionSchema } from '../schemas/image-conversion.schema';
import {
  ApiConversionImage,
  ApiGetImageConversionFormats,
} from '../swagger/image-conversion.swagger';

@Controller('images/convert')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
export class ImageConversionController {
  constructor(
    private readonly imageConversionService: ImageConversionService,
    private readonly settings: ConversionSettingsService,
  ) {}

  @Get('formats')
  @ApiGetImageConversionFormats()
  getFormats() {
    return IMAGE_CONVERSIONS;
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiConversionImage()
  async convert(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<StreamableFile> {
    const userId = request.user.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    let fileName = '';
    let fileBuffer: Buffer | undefined;
    let targetFormat: unknown;
    let options: unknown;
    const receivedFields = new Set<string>();
    const parts = request.parts();

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname !== 'targetFormat' && part.fieldname !== 'options') {
          throw new BadRequestException({
            code: 'UNSUPPORTED_FIELD',
            message: `Unsupported field: ${part.fieldname}`,
          });
        }

        if (receivedFields.has(part.fieldname)) {
          throw new BadRequestException({
            code: 'DUPLICATE_FIELD',
            message: `Field "${part.fieldname}" must be provided only once.`,
          });
        }

        receivedFields.add(part.fieldname);

        const value = String(part.value);

        if (part.fieldname === 'targetFormat') {
          targetFormat = value;
        }

        if (part.fieldname === 'options') {
          try {
            options = JSON.parse(value);
          } catch {
            throw new BadRequestException({
              code: 'INVALID_OPTIONS',
              message: 'Options must be a valid JSON object.',
            });
          }
        }

        continue;
      }

      if (part.fieldname !== 'file') {
        part.file.resume();

        throw new BadRequestException({
          code: 'UNSUPPORTED_FILE_FIELD',
          message: 'Only the "file" upload field is supported.',
        });
      }

      if (fileBuffer !== undefined) {
        part.file.resume();

        throw new BadRequestException({
          code: 'MULTIPLE_FILES_NOT_ALLOWED',
          message: 'Only one image can be uploaded.',
        });
      }

      fileName = part.filename;

      const sourceFormat = detectImageFormat(fileName);
      const maxFileSize = await this.settings.getMaxFileSize(sourceFormat);
      const chunks: Buffer[] = [];
      let totalSize = 0;

      for await (const chunk of part.file) {
        const buffer = Buffer.from(chunk);

        totalSize += buffer.length;

        if (totalSize > maxFileSize) {
          part.file.resume();

          throw new PayloadTooLargeException({
            code: 'FILE_TOO_LARGE',
            message:
              `Maximum file size for ${sourceFormat.toUpperCase()} ` +
              `is ${maxFileSize} bytes.`,
          });
        }

        chunks.push(buffer);
      }

      if (part.file.truncated) {
        throw new PayloadTooLargeException({
          code: 'FILE_TOO_LARGE',
          message: 'The uploaded image exceeds the multipart limit.',
        });
      }

      fileBuffer = Buffer.concat(chunks);
    }

    if (!fileBuffer || !fileName) {
      throw new BadRequestException({
        code: 'FILE_REQUIRED',
        message: 'Please upload an image.',
      });
    }

    if (!fileBuffer.length) {
      throw new BadRequestException({
        code: 'EMPTY_FILE',
        message: 'The uploaded image is empty.',
      });
    }

    const validation = imageConversionSchema.safeParse({
      targetFormat,
      options,
    });

    if (!validation.success) {
      throw new BadRequestException({
        code: 'INVALID_CONVERSION_PARAMETERS',
        message: 'Invalid image conversion parameters.',
        errors: validation.error.issues,
      });
    }

    const sourceFormat = detectImageFormat(fileName);
    const output = await this.imageConversionService.convert(
      userId,
      fileBuffer,
      sourceFormat,
      validation.data.targetFormat,
      validation.data.options ?? {},
    );

    reply.header(
      'Content-Type',
      getImageContentType(validation.data.targetFormat),
    );

    reply.header(
      'Content-Disposition',
      `attachment; filename="converted.${validation.data.targetFormat}"`,
    );

    reply.header('Content-Length', output.length);

    return new StreamableFile(Readable.from([output]));
  }
}
