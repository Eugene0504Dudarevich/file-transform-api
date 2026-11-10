import { HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import { SUPPORTED_FORMATS } from '../types/conversion.types';

export const ApiGetConversionFormats = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Get supported conversion formats',
      description:
        'Returns all supported file formats and available conversion combinations.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Supported formats retrieved successfully.',
      schema: {
        type: 'object',
        properties: {
          format: {
            type: 'array',
            items: {
              type: 'string',
              enum: [...SUPPORTED_FORMATS],
            },
            example: [...SUPPORTED_FORMATS],
          },
          conversions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                from: {
                  type: 'string',
                  enum: [...SUPPORTED_FORMATS],
                },
                to: {
                  type: 'string',
                  enum: [...SUPPORTED_FORMATS],
                },
              },
            },
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiConvertFile = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Convert an uploaded file',
      description:
        'Converts a file from its source format (CSV, JSON, XML or YAML) ' +
        'to the requested target format. Requires authentication.',
    })(target, propertyKey, descriptor);

    ApiConsumes('multipart/form-data')(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        required: ['file', 'targetFormat'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'File to convert.',
          },
          targetFormat: {
            type: 'string',
            enum: [...SUPPORTED_FORMATS],
            description: 'Desired output format.',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiProduces(
      'application/json',
      'application/xml',
      'application/yaml',
      'text/csv',
    )(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'File successfully converted.',
      content: {
        'application/octet-stream': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid request, missing file or invalid source content.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.PAYLOAD_TOO_LARGE,
      description: 'Uploaded file exceeds the maximum permitted size.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      description: 'Unsupported source or target format.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Unexpected conversion error.',
    })(target, propertyKey, descriptor);
  };
};
