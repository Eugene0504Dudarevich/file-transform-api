import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export const ApiUpdateRegistrationVerification = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Enable or disable registration email verification',
      description:
        'Development endpoint for changing the global registration email verification setting.',
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        required: ['enabled'],
        additionalProperties: false,
        properties: {
          enabled: {
            type: 'boolean',
            example: true,
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Registration email verification setting updated',
      schema: {
        type: 'object',
        properties: {
          registrationVerificationEnabled: {
            type: 'boolean',
            example: true,
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Invalid request data',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Unable to update registration verification setting.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiSetLoginVerification = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Enable or disable login verification',
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        required: ['enabled'],
        properties: {
          enabled: {
            type: 'boolean',
            example: true,
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Login verification setting updated successfully.',
      schema: {
        type: 'object',
        properties: {
          loginVerificationEnabled: {
            type: 'boolean',
            example: true,
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid request data',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Authentication is required.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description:
        'User does not have permission to update login verification setting.',
    });

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Login verification setting were not found.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Unable to update login verification setting.',
    })(target, propertyKey, descriptor);
  };
};
