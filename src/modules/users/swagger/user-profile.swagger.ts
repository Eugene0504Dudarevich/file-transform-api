import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

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
        'Only fields allowed by the profile policy are returned',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'userId',
      type: 'string',
      format: 'uuid',
      description: 'Id of user whose profile should be retrieved',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'User profile retrieved successfully',
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
            description: 'Additional explicitly permitted profile fields',
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
      description: 'Invalid user id',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or expired access JWT',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permissions',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
    })(target, propertyKey, descriptor);
  };
};
