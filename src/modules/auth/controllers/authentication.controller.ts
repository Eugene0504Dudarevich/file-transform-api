import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import {
  CredentialsInput,
  credentialsSchema,
} from '../schemas/credentials.schema';
import {
  VerifyLoginInput,
  verifyLoginSchema,
} from '@/modules/auth/schemas/verify-login.schema';
import { AuthenticationService } from '../services/authentication.service';
import { ApiLogin, ApiVerifyLogin } from '../swagger/authentication.swagger';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiLogin()
  async login(@Body() body: unknown) {
    const result = credentialsSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException(z.treeifyError(result.error));
    }

    const input: CredentialsInput = result.data;

    return this.authenticationService.login(input);
  }

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @ApiVerifyLogin()
  async verifyLogin(@Body() body: unknown) {
    const result = verifyLoginSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException(z.treeifyError(result.error));
    }

    const input: VerifyLoginInput = result.data;

    return this.authenticationService.verifyLogin(input);
  }
}
