import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthSettingsService } from '@/modules/admin/services/auth-settings.service';
import { EmailService } from '@/common/services/email.service';
import { OtpService } from '@/common/services/otp.service';
import { PasswordService } from './password.service';
import { PrismaService } from '@/core/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CredentialsInput } from '../schemas/credentials.schema';
import { VerificationCodeType } from '@/common/types/verification-code.type';
import { VerifyLoginInput } from '../schemas/verify-login.schema';
import { ResendLoginInput } from '../schemas/resend-login.schema';
import { getJwtSecrets } from '@/modules/auth/utils/auth-cookies';
import { AuthTokens, JwtTokenType } from '@/modules/auth/types/auth-token.type';
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from '@/modules/auth/constants/auth.constants';
import { JwtPayload } from '@/modules/auth/types/jwt-payload.type';

@Injectable()
export class AuthenticationService {
  private readonly accessSecret: string;

  private readonly refreshSecret: string;

  constructor(
    private readonly authSettingService: AuthSettingsService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    const { accessSecret, refreshSecret } = getJwtSecrets();

    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
  }

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

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.passwordService.compare(
      input.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isVerificationEnabled =
      await this.authSettingService.isLoginVerificationEnabled();

    if (!isVerificationEnabled) {
      return {
        success: true,
        requiresConfirmation: false,
        tokens: await this.createTokenPair(user.id, user.email),
      };
    }

    return this.createLoginVerification(user.id, user.email);
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
      tokens: await this.createTokenPair(user.id, user.email),
    };
  }

  async resendLoginCode(input: ResendLoginInput) {
    const verificationCode = await this.prisma.verificationCode.findUnique({
      where: {
        id: input.attemptId,
      },
      select: {
        id: true,
        userId: true,
        type: true,
        consumedAt: true,
        expiresAt: true,
        lastSentAt: true,
      },
    });

    if (
      !verificationCode ||
      verificationCode.type !== 'LOGIN' ||
      verificationCode.consumedAt ||
      verificationCode.expiresAt <= new Date()
    ) {
      throw new BadRequestException('Invalid or expired login attempt');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: verificationCode.userId },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new BadRequestException('Invalid or expired login attempt');
    }

    if (
      verificationCode.lastSentAt &&
      Date.now() - verificationCode.lastSentAt.getTime() <
        this.otpService.resendIntervalMilliseconds
    ) {
      throw new BadRequestException(
        'Please wait before requesting another code',
      );
    }

    await this.prisma.verificationCode.update({
      where: {
        id: verificationCode.id,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    return this.createLoginVerification(user.id, user.email);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (
      !payload.sub ||
      payload.tokenType !== 'refresh' ||
      typeof payload.sub !== 'string'
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Unable to refresh authentication');
    }

    return this.createTokenPair(user.id, user.email);
  }

  private async createTokenPair(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const payload = {
      sub: userId,
      email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          ...payload,
          tokenType: 'access' satisfies JwtTokenType,
        },
        {
          secret: this.accessSecret,
          expiresIn: ACCESS_TOKEN_TTL,
          algorithm: 'HS256',
        },
      ),
      this.jwtService.signAsync(
        {
          ...payload,
          tokenType: 'refresh' satisfies JwtTokenType,
        },
        {
          secret: this.refreshSecret,
          expiresIn: REFRESH_TOKEN_TTL,
          algorithm: 'HS256',
        },
      ),
    ]);

    return { accessToken, refreshToken };
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
}
