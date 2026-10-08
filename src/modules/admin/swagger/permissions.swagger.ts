import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export const ApiGetPermissions = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Get permissions',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'List of permissions returned successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiCreatePermission = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Create permission',
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        required: ['name', 'actions'],
        properties: {
          name: {
            type: 'string',
            example: 'users',
          },
          actions: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['create', 'read', 'update', 'delete'],
            },
            example: ['create', 'read', 'update', 'delete'],
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Permission created successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Permission already exists.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiUpdatePermission = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Update permission',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'permissionId',
      required: true,
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'users',
          },
          actions: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['create', 'read', 'update', 'delete'],
            },
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Permission updated successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Permission not found.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Permission already exists.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiDeletePermission = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Delete permission',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'permissionId',
      required: true,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Permission deleted successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Permission not found.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Permission has active grants.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};
