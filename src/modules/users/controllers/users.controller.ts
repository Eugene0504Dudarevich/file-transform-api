import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiCookieAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { UsersService } from '../services/users.service';
import { AuthenticatedUser } from '@/modules/auth/types/authenticated-user.type';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RequirePermission } from '@/modules/rbac/decorators/require-permission.decorator';
import { userListQuerySchema } from '../schemas/user-list-query.schema';
import { userIdParamsSchema } from '../schemas/user-params.schema';
import { updateUserSchema } from '../schemas/update-user.schema';
import {
  confirmEmailChangeSchema,
  initiateEmailChangeSchema,
} from '../schemas/email-change.schema';
import { confirmAccountDeletionSchema } from '../schemas/delete-user.schema';
import {
  ApiAccountDeletion,
  ApiConfirmEmailChange,
  ApiGetUsers,
  ApiInitiateAccountDeletion,
  ApiInitiateEmailChange,
  ApiUpdateUserProfile,
  ApiUserProfile,
} from '../swagger/users.swagger';
import { RbacGuard } from '@/modules/rbac/guards/rbac.guard';

type AuthenticatedFastifyRequest = FastifyRequest & {
  user: AuthenticatedUser;
};

@ApiCookieAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RbacGuard)
  @RequirePermission('users', 'read')
  @ApiGetUsers()
  async findAll(@Query() query: unknown) {
    const parsedQuery = userListQuerySchema.safeParse(query);

    if (!parsedQuery.success) {
      throw new BadRequestException(parsedQuery.error.issues);
    }

    return await this.usersService.findAll(parsedQuery.data);
  }

  @Get(':userId')
  @ApiUserProfile()
  async getUserProfile(
    @Param() params: unknown,
    @Req() request: AuthenticatedFastifyRequest,
  ) {
    const parsedParams = userIdParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      throw new BadRequestException({
        message: 'Invalid user id',
        errors: parsedParams.error.issues,
      });
    }

    return this.usersService.getUserProfile(
      request.user.id,
      parsedParams.data.userId,
    );
  }

  @Patch(':userId')
  @ApiUpdateUserProfile()
  async updateUserProfile(
    @Param() params: unknown,
    @Body() body: unknown,
    @Req() request: AuthenticatedFastifyRequest,
  ) {
    const parsedParams = userIdParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      throw new BadRequestException({
        message: 'Invalid user id',
        errors: parsedParams.error.issues,
      });
    }

    const parsedBody = updateUserSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsedBody.error.issues,
      });
    }

    return this.usersService.updateUserProfile(
      request.user.id,
      parsedParams.data.userId,
      parsedBody.data,
    );
  }

  @Post(':userId/email-change')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiInitiateEmailChange()
  initiateEmailChange(
    @Param() params: unknown,
    @Body() body: unknown,
    @Req() request: AuthenticatedFastifyRequest,
  ) {
    const parsedParams = userIdParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      throw new BadRequestException({
        message: 'Invalid user id',
        errors: parsedParams.error.issues,
      });
    }

    const parsedBody = initiateEmailChangeSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsedBody.error.issues,
      });
    }

    return this.usersService.initiateEmailChange(
      request.user.id,
      parsedParams.data.userId,
      parsedBody.data,
    );
  }

  @Post(':userId/email-change/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiConfirmEmailChange()
  async confirmEmailChange(
    @Param() params: unknown,
    @Body() body: unknown,
    @Req() request: AuthenticatedFastifyRequest,
  ) {
    const parsedParams = userIdParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      throw new BadRequestException({
        message: 'Invalid user id',
        errors: parsedParams.error.issues,
      });
    }

    const parsedBody = confirmEmailChangeSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsedBody.error.issues,
      });
    }

    return this.usersService.confirmEmailChange(
      request.user.id,
      parsedParams.data.userId,
      parsedBody.data,
    );
  }

  @Post(':userId/deletion-confirmation')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiInitiateAccountDeletion()
  async initiateAccountDeletion(
    @Param() params: unknown,
    @Req() request: AuthenticatedFastifyRequest,
  ) {
    const parsedParams = userIdParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      throw new BadRequestException({
        message: 'Invalid user id',
        errors: parsedParams.error.issues,
      });
    }

    return this.usersService.initiateAccountDeletion(
      request.user.id,
      parsedParams.data.userId,
    );
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAccountDeletion()
  async deleteUser(
    @Param() params: unknown,
    @Body() body: unknown,
    @Req() request: AuthenticatedFastifyRequest,
  ) {
    const parsedParams = userIdParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      throw new BadRequestException({
        message: 'Invalid user id',
        errors: parsedParams.error.issues,
      });
    }

    const targetUserId = parsedParams.data.userId;
    const actorUserId = request.user.id;
    const isSelf = actorUserId === targetUserId;
    let code: string | undefined;

    if (isSelf) {
      const parsedBody = confirmAccountDeletionSchema.safeParse(body);

      if (!parsedBody.success) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: parsedBody.error.issues,
        });
      }

      code = parsedBody.data.code;
    }

    await this.usersService.deleteUser(actorUserId, targetUserId, code);
  }
}
