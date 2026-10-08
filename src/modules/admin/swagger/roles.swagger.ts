import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export const ApiGetRoles = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Get roles',
      description: 'Returns the list of roles.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'List of roles returned successfully',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiCreateRole = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Create role',
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            example: 'ADMIN',
          },
          description: {
            type: 'string',
            example: 'System administrator',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Role created successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Role with this name already exists.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiUpdateRole = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Update role',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'roleId',
      required: true,
      description: 'Role identifier',
    })(target, propertyKey, descriptor);

    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'ADMIN',
          },
          description: {
            type: 'string',
            example: 'Updated description',
          },
        },
      },
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Role updated successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Role not found.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Role with this name already exists.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};

export const ApiDeleteRole = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiOperation({
      summary: 'Delete role',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'roleId',
      required: true,
      description: 'Role identifier',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Role deleted successfully.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Role not found.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Role has active grants.',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'User does not have permission.',
    })(target, propertyKey, descriptor);
  };
};
