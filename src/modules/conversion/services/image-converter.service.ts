import {
  BadRequestException,
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { SvgValidatorService } from './svg-validator.service';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import {
  ImageFormat,
  RasterImageFormat,
} from '../types/image-conversion.types';
import { ImageConversionOptions } from '../schemas/image-conversion.schema';
import {
  DEFAULT_JPEG_QUALITY,
  DEFAULT_SVG_BACKGROUND,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_PIXELS,
} from '../constants/image-conversion.constants';

@Injectable()
export class ImageConverterService {
  constructor(private readonly svgValidator: SvgValidatorService) {}

  async convert(
    input: Buffer,
    sourceFormat: ImageFormat,
    targetFormat: RasterImageFormat,
    options: ImageConversionOptions = {},
  ): Promise<Buffer> {
    if (options.quality !== undefined && targetFormat !== 'jpeg') {
      throw new BadRequestException({
        code: 'INVALID_QUALITY_OPTION',
        message: 'The quality option is only supported for JPEG output.',
      });
    }

    if (
      sourceFormat !== 'svg' &&
      (options.width !== undefined ||
        options.height !== undefined ||
        options.background !== undefined)
    ) {
      throw new BadRequestException({
        code: 'INVALID_RASTER_OPTION',
        message:
          'Width, height and background options are only supported for SVG rasterization.',
      });
    }

    if (sourceFormat === targetFormat) {
      throw new BadRequestException({
        code: 'SAME_FORMAT',
        message: 'Source and target format must be different.',
      });
    }

    if (sourceFormat === 'svg') {
      return this.convertSvg(input, targetFormat, options);
    }

    return this.convertRaster(input, sourceFormat, targetFormat, options);
  }

  private async convertSvg(
    input: Buffer,
    targetFormat: RasterImageFormat,
    options: ImageConversionOptions,
  ): Promise<Buffer> {
    const svg = this.svgValidator.validate(input);
    const background = options.background ?? DEFAULT_SVG_BACKGROUND;

    const baseRenderer = new Resvg(svg, {
      background,
      font: {
        loadSystemFonts: false,
      },
    });

    const originalWidth = baseRenderer.width;
    const originalHeight = baseRenderer.height;

    let scale = 1;

    if (options.width && options.height) {
      scale = Math.min(
        options.width / originalWidth,
        options.height / originalHeight,
      );
    } else if (options.width) {
      scale = options.width / originalWidth;
    } else if (options.height) {
      scale = options.height / originalHeight;
    }

    const expectedWidth = Math.round(originalWidth * scale);
    const expectedHeight = Math.round(originalHeight * scale);

    this.validateDimensions(expectedWidth, expectedHeight);

    const renderer =
      scale === 1
        ? baseRenderer
        : new Resvg(svg, {
            background,
            fitTo: {
              mode: 'zoom',
              value: scale,
            },
            font: {
              loadSystemFonts: false,
            },
          });

    const output = Buffer.from(renderer.render().asPng());

    let pipeline = sharp(output, {
      limitInputPixels: MAX_IMAGE_PIXELS,
      failOn: 'error',
    });

    if (options.width && options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: 'contain',
        background,
      });
    }

    if (targetFormat === 'jpeg') {
      pipeline = pipeline
        .flatten({
          background,
        })
        .jpeg({
          quality: options.quality ?? DEFAULT_JPEG_QUALITY,
        });
    } else {
      pipeline = pipeline.png();
    }

    return pipeline.toBuffer();
  }

  private validateDimensions(width?: number, height?: number): void {
    if (!width || !height) {
      throw new BadRequestException({
        code: 'INVALID_IMAGE_DIMENSIONS',
        message: 'Image dimensions could not be determined.',
      });
    }

    if (
      width > MAX_IMAGE_DIMENSION ||
      height > MAX_IMAGE_DIMENSION ||
      width * height > MAX_IMAGE_PIXELS
    ) {
      throw new UnsupportedMediaTypeException({
        code: 'IMAGE_DIMENSIONS_EXCEEDED',
        message: 'Image dimensions exceed the maximum allowed limits.',
      });
    }
  }

  private async convertRaster(
    input: Buffer,
    sourceFormat: 'png' | 'jpeg',
    targetFormat: RasterImageFormat,
    options: ImageConversionOptions,
  ): Promise<Buffer> {
    const image = sharp(input, {
      failOn: 'error',
      limitInputPixels: MAX_IMAGE_PIXELS,
      animated: false,
    });
    let metadata: sharp.Metadata;

    try {
      metadata = await image.metadata();
    } catch {
      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'The uploaded image is invalid or corrupted.',
      });
    }

    if (metadata.format !== sourceFormat) {
      throw new BadRequestException({
        code: 'IMAGE_FORMAT_MISMATCH',
        message: 'The image content does not match its file extension.',
      });
    }

    this.validateDimensions(metadata.width, metadata.height);

    let pipeline = sharp(input, {
      failOn: 'error',
      limitInputPixels: MAX_IMAGE_PIXELS,
      animated: false,
    }).rotate();

    if (targetFormat === 'jpeg') {
      pipeline = pipeline
        .flatten({
          background: DEFAULT_SVG_BACKGROUND,
        })
        .jpeg({
          quality: options.quality ?? DEFAULT_JPEG_QUALITY,
        });
    } else {
      pipeline = pipeline.png();
    }

    try {
      return await pipeline.toBuffer();
    } catch {
      throw new BadRequestException({
        code: 'IMAGE_CONVERSION_FAILED',
        message: 'Failed to convert the uploaded image.',
      });
    }
  }
}
