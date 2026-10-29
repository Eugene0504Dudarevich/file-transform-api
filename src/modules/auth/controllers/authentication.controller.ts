import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { type FastifyReply, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  CredentialsInput,
  credentialsSchema,
} from '../schemas/credentials.schema';
import {
  VerifyLoginInput,
  verifyLoginSchema,
} from '../schemas/verify-login.schema';
import {
  ResendLoginInput,
  resendLoginSchema,
} from '../schemas/resend-login.schema';
import AuthenticationService from '../services/authentication.service';
import { clearAuthCookies, setAuthCookies } from '../utils/auth-cookies';
import {
  ApiLogin,
  ApiLogout,
  ApiRefreshTokens,
  ApiResendLoginCode,
  ApiVerifyLogin,
} from '../swagger/authentication.swagger';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiLogin()
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = credentialsSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException(z.treeifyError(result.error));
    }

    const input: CredentialsInput = result.data;

    const authenticationResult = await this.authenticationService.login(input);

    if ('tokens' in authenticationResult) {
      setAuthCookies(reply, authenticationResult.tokens);

      return {
        success: true,
        requiresConfirmation: false,
      };
    }

    return authenticationResult;
  }

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @ApiVerifyLogin()
  async verifyLogin(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = verifyLoginSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException(z.treeifyError(result.error));
    }

    const input: VerifyLoginInput = result.data;
    const authenticationResult =
      await this.authenticationService.verifyLogin(input);

    setAuthCookies(reply, authenticationResult.tokens);

    return {
      success: true,
      requiresConfirmation: false,
    };
  }

  @Post('login/resend')
  @HttpCode(HttpStatus.OK)
  @ApiResendLoginCode()
  async resendLoginCode(@Body() body: unknown) {
    const result = resendLoginSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException(z.treeifyError(result.error));
    }

    const input: ResendLoginInput = result.data;

    return this.authenticationService.resendLoginCode(input);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiRefreshTokens()
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const tokens = await this.authenticationService.refresh(
      request.cookies?.refresh_token,
    );

    setAuthCookies(reply, tokens);

    return { success: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiLogout()
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    clearAuthCookies(reply);

    return { success: true };
  }
}
