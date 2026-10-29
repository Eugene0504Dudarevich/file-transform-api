import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export const ApiGetUsers = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Get users',
      description:
        'Returns a cursor-paginated list of users. Requires the users.read permission.',
    })(target, propertyKey, descriptor);

    ApiQuery({
      name: 'cursor',
      required: false,
      type: 'string',
      description: 'Id of the last user returned on the previous page.',
    })(target, propertyKey, descriptor);

    ApiQuery({
      name: 'limit',
      required: false,
      type: 'number',
      example: 20,
      description: 'Number of users per page. Defaults to 20; maximum 100.',
    })(target, propertyKey, descriptor);

    ApiQuery({
      name: 'q',
      required: false,
      type: 'string',
      description: 'Case-insensitive email search or exact UUID search.',
    })(target, propertyKey, descriptor);

    ApiQuery({
      name: 'status',
      required: false,
      enum: ['pending', 'active', 'blocked'],
    })(target, propertyKey, descriptor);

    ApiQuery({
      name: 'sort',
      required: false,
      enum: ['created_at', 'last_login', 'email'],
      description: 'Sort field. Defaults to created_at.',
    })(target, propertyKey, descriptor);

    ApiQuery({
      name: 'order',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort direction. Defaults to desc.',
    });

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Users returned successfully.',
      schema: {
        type: 'object',
        required: ['items', 'nextCursor'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: [
                'id',
                'email',
                'photoUrl',
                'createdAt',
                'status',
                'lastLoginAt',
              ],
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                photoUrl: { type: 'string', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                status: {
                  type: 'string',
                  enum: ['PENDING', 'ACTIVE', 'BLOCKED'],
                },
                lastLoginAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
              },
            },
          },
          nextCursor: {
            type: 'string',
            format: 'uuid',
            nullable: true,
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid query parameters or pagination cursor.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'The user does not have the users.read permission.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: 'Request rate limit exceeded, if rate limiting is enabled.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiUserProfile = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Get user profile',
      description:
        'Returns the current user profile or another user profile' +
        'when the viewer has users.read permissions.' +
        'Only fields allowed by the profile policy are returned.',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'userId',
      type: 'string',
      format: 'uuid',
      description: 'Id of user whose profile should be retrieved.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'User profile retrieved successfully.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          photo: {
            type: 'string',
            nullable: true,
            example: '/uploads/avatars/example.jpg',
          },
          fields: {
            type: 'object',
            description: 'Additional explicitly permitted profile fields.',
            example: {},
          },
        },
        example: {
          id: '8a4c5a16-53f1-4e7a-9ed4-4cc5bbd6ed8',
          email: 'user@example.com',
          photo: null,
          fields: {},
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid user id.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permissions.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiUpdateUserProfile = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Update user profile',
      description:
        'Updates permitted profile fields. User can update their own photo ' +
        'but cannot change their email through this endpoint. ' +
        'Self-service email changes require the email verification flow. ' +
        'Users with users.update permission can update another users ' +
        'profile, including changing their email directly.',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'userId',
      type: 'string',
      format: 'uuid',
      description: 'Id of the user to update.',
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'new@example.com',
          },
          photo: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/avatar.jpg',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'User profile updated successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid parameters or request body.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Email is already in use.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiInitiateEmailChange = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Initiate email change',
      description:
        'Creates an email-change verification change and send OTP ' +
        'to the new email address. Only the account owner may initiate the change.',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'userId',
      type: 'string',
      format: 'uuid',
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['newEmail'],
        properties: {
          newEmail: {
            type: 'string',
            format: 'email',
            example: 'new@example.com',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Verification change created.',
      schema: {
        example: {
          success: true,
          requiresConfirmation: true,
          changeId: '7c3e4c9a-5e40-4a2c-bf6c-4b22f48e27e2',
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid email or resend cooldown has not elapsed.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Email can only be changed by its owner.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Email is already in use.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: 'Rate limit exceeded.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiConfirmEmailChange = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Confirm email change',
      description:
        'Verifies the OTP send to the new email and updates the account email.',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'userId',
      type: 'string',
      format: 'uuid',
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['code'],
        properties: {
          code: {
            type: 'string',
            pattern: '^\\d{6}$',
            example: '123456',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Email changed successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid, expired, consumed, or exhausted OTP.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Email can only be changed by its owner.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Email is already in use.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: 'Rate limit exceeded.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiInitiateAccountDeletion = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Request account deletion confirmation',
      description:
        'Sends an OTP to the authenticated user’s current email. Only the account owner may request this confirmation.',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'userId',
      type: 'string',
      description: 'Id of the account to delete.',
      format: 'uuid',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Confirmation email requested successfully.',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          requiresConfirmation: { type: 'boolean', example: true },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid user id or resend cooldown.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Only the account owner may request confirmation.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: 'Too many requests.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiAccountDeletion = (): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Delete a user account',
      description:
        'The account owner must provide the OTP sent to their email. Another user may delete the account only with the users.delete RBAC permission.',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'userId',
      description: 'Id of the account to delete.',
      format: 'uuid',
    })(target, propertyKey, descriptor);

    ApiBody({
      required: false,
      schema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            minLength: 6,
            maxLength: 6,
            pattern: '^\\d{6}$',
            example: '123456',
            description: 'Required when deleting your own account.',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Account deleted successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid or expired confirmation code.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission to delete this account.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: 'Too many requests.',
    })(target, propertyKey, descriptor);
  };
};
