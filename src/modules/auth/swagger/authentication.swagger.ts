import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export const ApiLogin = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Authenticate user',
      description:
        'Authenticates a user with email and password. If login email verification is enabled, an OTP is sent and access token is not issued until verification',
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Password123!',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Login successful or login verification initiated.',
      schema: {
        oneOf: [
          {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: true,
              },
              requiresConfirmation: {
                type: 'boolean',
                example: false,
              },
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIs...',
              },
            },
          },
          {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: true,
              },
              requiresConfirmation: {
                type: 'boolean',
                example: true,
              },
              attemptId: {
                type: 'string',
                format: 'uuid',
              },
            },
          },
        ],
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Invalid request data',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid email or password',
    })(target, propertyKey, descriptor);
  };
};

export const ApiVerifyLogin = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Verify login with OTP',
      description:
        'Verifies the login attempt using the OTP sent to the user email and issues an access token after successful verification.',
    })(target, propertyKey, descriptor);

    ApiBody({
      description: 'Login verification data',
      schema: {
        type: 'object',
        required: ['attemptId', 'otpCode'],
        properties: {
          attemptId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
            description: 'Id of the pending login verification attempt.',
          },
          otpCode: {
            type: 'string',
            example: '123456',
            minLength: 6,
            maxLength: 6,
            description: 'Six-digit OTP sent to the user email.',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Login successfully verified and an access token is issued',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
            description: 'Indicates that the login verification succeeded.',
          },
          requiresConfirmation: {
            type: 'boolean',
            example: false,
            description:
              'Indicated whether another confirmation step is required.',
          },
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'JWT access token.',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        'Invalid or expired OTP, maximum number of attempts exceeded, or the verification code could not be consumed',
      schema: {
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            example: 400,
          },
          message: {
            type: 'string',
            examples: [
              'Invalid or expired code',
              'Too many attempts',
              'Unable to verify login',
            ],
          },
          error: {
            type: 'string',
            example: 'Bad Request',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid authentication credentials.',
      schema: {
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            example: 401,
          },
          message: {
            type: 'string',
            example: 'Invalid credentials',
          },
          error: {
            type: 'string',
            example: 'Unauthorized',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'The user or login attempts was not found.',
      schema: {
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            example: 404,
          },
          message: {
            type: 'string',
            example: 'Login attempt not found',
          },
          error: {
            type: 'string',
            example: 'Not Found',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error while completing login',
      schema: {
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            example: 500,
          },
          message: {
            type: 'string',
            example: 'Unable to complete login',
          },
          error: {
            type: 'string',
            example: 'Internal Server Error',
          },
        },
      },
    })(target, propertyKey, descriptor);
  };
};
