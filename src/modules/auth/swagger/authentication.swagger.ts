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

export const ApiResendLoginCode = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Resend login verification code',
      description:
        'Resends a new verification code for an active login verification attempt. The previous verification attempt is consumed and new attempt is created.',
    })(target, propertyKey, descriptor);

    ApiBody({
      description:
        'Login verification attempt for which a new code is requested.',
      schema: {
        type: 'object',
        required: ['attemptId'],
        properties: {
          attemptId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the current login verification attempt.',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'A new login verification code was generated successfully.',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates that the operation completed successfully.',
            example: 'true',
          },
          requiresConfirmation: {
            type: 'boolean',
            description:
              'Indicates that the user must confirm the login using the verification code.',
            example: 'true',
          },
          attemptId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the newly created login verification attempt.',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
        example: {
          success: true,
          requiresConfirmation: true,
          attemptId: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        'The login verification attempt is invalid or expired, the user is not active, or the resend interval has not elapsed.',
      schema: {
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            example: 400,
          },
          message: {
            oneOf: [
              {
                type: 'string',
                example: 'Invalid or expired login attempt',
              },
              {
                type: 'string',
                example: 'Please wait before requesting another code',
              },
            ],
          },
          error: {
            type: 'string',
            example: 'Bad Request',
          },
        },
        examples: [
          {
            statusCode: 400,
            message: 'Invalid or expired login attempt',
            error: 'Bad Request',
          },
          {
            statusCode: 400,
            message: 'Please wait before requesting another code',
            error: 'Bad Request',
          },
        ],
      },
    })(target, propertyKey, descriptor);
  };
};

export const ApiRefreshTokens = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Refresh authentication tokens',
      description: [
        'Validates  the refresh_token cookie and issue a new access and refresh token pair.',
        'Both authentication cookies are updated in the response.',
        'The refresh token is rotated after each successful refresh.',
        'Refresh tokens are not stored on the server, so previously issued tokens cannot be individually revoked.',
      ].join(' '),
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description:
        'Tokens refreshed successfully. New access_token and refresh_token cookies are set.',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: 'true',
          },
        },
      },
      headers: {
        'Set-Cookie': {
          description:
            'Sets the new access_token and refresh_token cookies with their configured security attribute',
          schema: {
            type: 'string',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description:
        'Refresh token is missing, invalid, expired, has an incorrect token type, or belongs to user who is no longer active',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description:
        'Server configuration error or unexpected failure while issuing tokens.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiLogout = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Log out',
      description: [
        'Clears the access_token and refresh_token authentication cookies.',
        'The endpoint does not revoke previously issued JWTs on the server.',
        'A copied refresh token may remain usable until it expires, subject to user status and token validation.',
      ].join(' '),
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Authentication cookies cleared successfully.',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: 'true',
          },
        },
      },
      headers: {
        'Set-Cookie': {
          description: 'Expires the access_token and refresh_token cookies',
          schema: {
            type: 'string',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Unexpected failure while clearing authentication cookies.',
    })(target, propertyKey, descriptor);
  };
};
