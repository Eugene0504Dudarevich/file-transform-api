import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export function ApiUpdateRegistrationVerification() {
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
          registrationEmailVerificationEnabled: {
            type: 'boolean',
            example: true,
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Invalid request body',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Unable to update authentication settings',
    })(target, propertyKey, descriptor);
  };
}
