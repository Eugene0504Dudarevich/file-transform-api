import { Module } from '@nestjs/common';
import { RegistrationController } from './controllers/registration.controller';
import { EmailService } from './services/email.service';
import { OtpService } from './services/otp.service';
import { PasswordService } from './services/password.service';
import { RegistrationService } from './services/registration.service';
import { AuthSettingsService } from '@/modules/admin/services/auth-settings.service';

@Module({
  controllers: [RegistrationController],
  providers: [
    AuthSettingsService,
    EmailService,
    OtpService,
    PasswordService,
    RegistrationService,
  ],
  exports: [AuthSettingsService],
})
export class AuthModule {}
