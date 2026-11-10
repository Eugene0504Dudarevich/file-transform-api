import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import {
  IMAGE_CONVERSIONS,
  IMAGE_FORMATS,
  IMAGE_TARGET_FORMATS,
} from '@/modules/conversion/types/image-conversion.types';

const ERROR_SCHEMA = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      example: 'INVALID_IMAGE',
    },
    message: {
      type: 'string',
      example: 'The uploaded image is invalid.',
    },
  },
};

export const ApiGetImageConversionFormats = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Get supported image conversion formats',
      description:
        'Returns all supported image formats and available conversion directions. ' +
        'PNG/JPEG to SVG vectorization is not supported. Requires authentication.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Supported image conversions retrieved successfully.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              enum: [...IMAGE_FORMATS],
              example: 'svg',
            },
            target: {
              type: 'array',
              items: {
                type: 'string',
                enum: [...IMAGE_TARGET_FORMATS],
              },
              example: ['png', 'jpeg'],
            },
          },
        },
        example: IMAGE_CONVERSIONS,
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
      schema: ERROR_SCHEMA,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error.',
      schema: ERROR_SCHEMA,
    })(target, propertyKey, descriptor);
  };
};

export const ApiConversionImage = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Convert an uploaded image',
      description:
        'Converts an uploaded PNG, JPEG or SVG image into PNG or JPEG. ' +
        'SVG input is rasterized. Requires an authenticated user.',
    })(target, propertyKey, descriptor);

    ApiConsumes('multipart/form-data')(target, propertyKey, descriptor);

    ApiBody({
      required: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['file', 'targetFormat'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Source image. Supported formats: PNG, JPEG and SVG.',
          },
          targetFormat: {
            type: 'string',
            enum: [...IMAGE_TARGET_FORMATS],
            example: 'jpeg',
            description: 'Desired output image format.',
          },
          options: {
            type: 'string',
            example: '{"quality":85}',
            description:
              'Optional JSON string. Supported properties: ' +
              'quality (1-100), width (1-4096), height (1-4096), ' +
              'background (hexadecimal color). ' +
              'Quality is supported for JPEG output. ' +
              'Width, height and background are supported for SVG rasterization.',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiProduces('image/png', 'image/jpeg')(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description:
        'Image successfully converted. Returns the converted image as a binary file.',
      content: {
        'image/png': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
        'image/jpeg': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      headers: {
        'Content-Disposition': {
          description: 'Download filename.',
          schema: {
            type: 'string',
            example: 'attachment; filename="converted.jpeg"',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        'Missing parameters, invalid image, invalid conversion options, or unsupported conversion direction.',
      schema: ERROR_SCHEMA,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
      schema: ERROR_SCHEMA,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.PAYLOAD_TOO_LARGE,
      description:
        'The uploaded image exceeds the configured maximum file size.',
      schema: ERROR_SCHEMA,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      description: 'Unsupported source image format.',
      schema: ERROR_SCHEMA,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Unexpected image conversion or internal server error.',
      schema: ERROR_SCHEMA,
    })(target, propertyKey, descriptor);
  };
};
