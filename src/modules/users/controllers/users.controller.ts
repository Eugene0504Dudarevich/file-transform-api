import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { UsersService } from '../services/users.service';
import { AuthenticatedUser } from '@/modules/auth/types/authenticated-user.type';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { userProfileSchema } from '../schemas/user-profile.schema';
import { ApiUserProfile } from '../swagger/user-profile.swagger';

type AuthenticatedFastifyRequest = FastifyRequest & {
  user: AuthenticatedUser;
};

@ApiCookieAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId')
  @ApiUserProfile()
  async getUserProfile(
    @Param() params: unknown,
    @Req() request: AuthenticatedFastifyRequest,
  ) {
    const parsedParams = userProfileSchema.safeParse(params);

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
}
