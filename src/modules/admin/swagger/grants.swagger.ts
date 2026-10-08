import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

const actionsSchema = {
  type: 'array',
  items: {
    type: 'string',
    enum: ['read', 'create', 'update', 'delete'],
  },
  example: ['read', 'update'],
};

export const ApiGetGrants = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Get grants',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'List of grants returned successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiCreateGrant = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Create grant',
      description:
        'Creates a role-permission assignment. Empty actions means all actions are allowed',
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        required: ['roleId', 'permissionId'],
        properties: {
          roleId: {
            type: 'string',
            example: '',
          },
          permissionId: {
            type: 'string',
            example: '',
          },
          actions: actionsSchema,
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Grant created successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Role or permission not found',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Grant already exists or contains invalid actions.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiUpdateGrant = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Update grant',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'grantId',
      required: true,
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        properties: {
          roleId: {
            type: 'string',
          },
          permissionId: {
            type: 'string',
          },
          actions: actionsSchema,
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Grant updated successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Grant, role, or permission not found',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Grant already exists or contains invalid actions.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiDeleteGrant = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Delete grant',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'grantId',
      required: true,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Grant deleted successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Grant not found',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};
