import { HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiGetConversionSettings = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Get conversion settings',
      description:
        'Returns the maximum allowed upload size for each supported source format. ' +
        'Requires administrator privileges.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Conversion settings retrieved successfully.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sourceFormat: {
              type: 'string',
              enum: ['csv', 'json', 'xml', 'yaml'],
            },
            maxFileSizeBytes: {
              type: 'integer',
              example: 5242880,
            },
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Administrator access required.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve conversion settings.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiUpdateConversionSetting = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Update conversion settings',
      description:
        'Updates the maximum allowed upload size for a specified source format. ' +
        'Requires administrator privileges.',
    })(target, propertyKey, descriptor);

    ApiBody({
      required: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['sourceFormat', 'maxFileSizeBytes'],
        properties: {
          sourceFormat: {
            type: 'string',
            enum: ['csv', 'json', 'xml', 'yaml'],
            example: 'json',
          },
          maxFileSizeBytes: {
            type: 'integer',
            minimum: 1,
            maximum: 10485760,
            description: 'Maximum permitted upload size in bytes.',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Conversion setting updated successfully.',
      schema: {
        type: 'object',
        properties: {
          sourceFormat: {
            type: 'string',
            enum: ['csv', 'json', 'xml', 'yaml'],
          },
          maxFileSizeBytes: {
            type: 'integer',
            example: 10485760,
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid source format or maximum file size.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Administrator access required.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update conversion settings.',
    })(target, propertyKey, descriptor);
  };
};
