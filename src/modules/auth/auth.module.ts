import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationController } from './controllers/authentication.controller';
import { RegistrationController } from './controllers/registration.controller';
import { AuthenticationService } from './services/authentication.service';
import { AuthSettingsService } from '@/modules/admin/services/auth-settings.service';
import { EmailService } from './services/email.service';
import { OtpService } from './services/otp.service';
import { PasswordService } from './services/password.service';
import { RegistrationService } from './services/registration.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [AuthenticationController, RegistrationController],
  providers: [
    AuthenticationService,
    AuthSettingsService,
    EmailService,
    OtpService,
    PasswordService,
    RegistrationService,
    JwtStrategy,
  ],
  exports: [AuthSettingsService],
})
export class AuthModule {}
