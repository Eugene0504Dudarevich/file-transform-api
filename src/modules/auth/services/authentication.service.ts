import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthSettingsService } from '@/modules/admin/services/auth-settings.service';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';
import { PasswordService } from './password.service';
import { PrismaService } from '@/core/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CredentialsInput } from '../schemas/credentials.schema';
import { VerificationCodeType } from '@/modules/auth/types/verification-code.type';
import { VerifyLoginInput } from '@/modules/auth/schemas/verify-login.schema';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly authSettingService: AuthSettingsService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: CredentialsInput) {
    const email = input.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.passwordService.compare(
      input.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isVerificationEnabled =
      await this.authSettingService.isLoginVerificationEnabled();

    if (!isVerificationEnabled) {
      return {
        success: true,
        requiresConfirmation: false,
        accessToken: this.createAccessToken(user.id, user.email),
      };
    }

    return this.createLoginVerification(user.id, user.email);
  }

  private createAccessToken(userId: string, email: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
    });
  }

  private async createLoginVerification(userId: string, email: string) {
    await this.prisma.verificationCode.updateMany({
      where: {
        userId,
        type: VerificationCodeType.LOGIN,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    const otpCode = this.otpService.generateCode();

    try {
      const verificationCode = await this.prisma.verificationCode.create({
        data: {
          userId,
          type: VerificationCodeType.LOGIN,
          code: this.otpService.hashCode(otpCode),
          expiresAt: this.otpService.expirationDate,
          maxAttempts: this.otpService.maxAttempts,
          lastSentAt: new Date(),
        },
      });

      await this.emailService.sendVerificationCode(
        email,
        otpCode,
        VerificationCodeType.LOGIN,
      );

      return {
        success: true,
        requiresConfirmation: true,
        attemptId: verificationCode.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Unable to initiate login verification',
      );
    }
  }

  async verifyLogin(input: VerifyLoginInput) {
    const verificationCode = await this.otpService.getCodeById(
      input.attemptId,
      VerificationCodeType.LOGIN,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: verificationCode.userId },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Unable to complete login');
    }

    await this.otpService.verifyCodeById(
      input.attemptId,
      VerificationCodeType.LOGIN,
      input.otpCode,
    );

    await this.otpService.consumeVerificationCode(
      verificationCode.id,
      VerificationCodeType.LOGIN,
    );

    return {
      success: true,
      requiresConfirmation: false,
      accessToken: this.createAccessToken(user.id, user.email),
    };
  }
}
