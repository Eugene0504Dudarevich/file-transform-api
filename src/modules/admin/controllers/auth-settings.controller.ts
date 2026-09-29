import { Body, Controller, Patch } from '@nestjs/common';
import { AuthSettingsService } from '../services/auth-settings.service.js';
import {
  type UpdateRegistrationVerificationInput,
  updateRegistrationVerificationSchema,
} from '../schemas/auth-settings.schema.js';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { ApiUpdateRegistrationVerification } from '../swagger/auth-settings.swagger.js';

@Controller('admin/auth-settings')
export class AuthSettingsController {
  constructor(private readonly authSettingService: AuthSettingsService) {}

  @Patch('registration-verification')
  @ApiUpdateRegistrationVerification()
  async updateRegistrationVerification(
    @Body(new ZodValidationPipe(updateRegistrationVerificationSchema))
    body: UpdateRegistrationVerificationInput,
  ) {
    const settings =
      await this.authSettingService.setRegistrationEmailVerification(
        body.enabled,
      );

    return {
      registrationVerificationEnabled: settings.registrationVerificationEnabled,
    };
  }
}
