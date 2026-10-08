import { BadRequestException, Body, Controller, Patch } from '@nestjs/common';
import { z } from 'zod';
import { AuthSettingsService } from '../services/auth-settings.service.js';
import {
  type UpdateVerificationInput,
  updateVerificationSchema,
} from '../schemas/auth-settings.schema.js';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  ApiSetLoginVerification,
  ApiUpdateRegistrationVerification,
} from '../swagger/auth-settings.swagger.js';

@Controller('admin/auth-settings')
export class AuthSettingsController {
  constructor(private readonly authSettingService: AuthSettingsService) {}

  @Patch('registration-verification')
  @ApiUpdateRegistrationVerification()
  async updateRegistrationVerification(
    @Body(new ZodValidationPipe(updateVerificationSchema))
    body: UpdateVerificationInput,
  ) {
    const settings = await this.authSettingService.setRegistrationVerification(
      body.enabled,
    );

    return {
      registrationVerificationEnabled: settings.registrationVerificationEnabled,
    };
  }

  @Patch('login-verification')
  @ApiSetLoginVerification()
  async setLoginVerification(@Body() body: unknown) {
    const result = updateVerificationSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException(z.treeifyError(result.error));
    }

    const settings = await this.authSettingService.setLoginVerification(
      result.data.enabled,
    );

    return {
      loginVerificationEnabled: settings.loginVerificationEnabled,
    };
  }
}
