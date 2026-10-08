import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuthSettingsService } from '../../admin/services/auth-settings.service.js';
import { EmailService } from './email.service.js';
import { OtpService } from './otp.service.js';
import { PasswordService } from './password.service.js';
import { PrismaService } from '@/core/database/prisma.service';
import { CredentialsInput } from '../schemas/credentials.schema.js';
import { VerificationCodeType } from '../types/verification-code.type';
import { VerifyRegistrationInput } from '../schemas/verify-registration.schema.js';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly authSettingsService: AuthSettingsService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
  ) {}

  async register(input: CredentialsInput) {
    const email = input.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    try {
      const passwordHash = await this.passwordService.hash(input.password);
      const isVerificationEnabled =
        await this.authSettingsService.isRegistrationVerificationEnabled();
      const status = isVerificationEnabled ? 'PENDING' : 'ACTIVE';
      const emailVerified = isVerificationEnabled ? null : new Date();

      if (!isVerificationEnabled) {
        const user = await this.prisma.user.create({
          data: {
            email,
            password: passwordHash,
            status,
            emailVerified,
          },
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        });

        return {
          success: true,
          requiresConfirmation: false,
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
          },
        };
      }

      const result = await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            email,
            password: passwordHash,
            status,
            emailVerified,
          },
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        });

        const otpCode = this.otpService.generateCode();
        const codeHash = this.otpService.hashCode(otpCode);
        const expiresAt = this.otpService.expirationDate;

        await transaction.verificationCode.create({
          data: {
            userId: user.id,
            type: 'REGISTRATION',
            code: codeHash,
            expiresAt,
            maxAttempts: this.otpService.maxAttempts,
            lastSentAt: new Date(),
          },
        });

        return {
          user,
          otpCode,
        };
      });

      await this.emailService.sendVerificationCode(
        result.user.email,
        result.otpCode,
        VerificationCodeType.REGISTRATION,
      );

      return {
        success: true,
        requiresConfirmation: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Unable to register user');
    }
  }

  async verifyRegistration(input: VerifyRegistrationInput) {
    const email = input.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new ConflictException(
        'User registration has already been verified',
      );
    }

    if (user.status !== 'PENDING') {
      throw new BadRequestException('Invalid or expired code');
    }

    const verificationCodeId = await this.otpService.verifyCodeForUser(
      user.id,
      VerificationCodeType.REGISTRATION,
      input.code,
    );

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          emailVerified: new Date(),
        },
      });

      await this.otpService.consumeVerificationCode(
        verificationCodeId,
        VerificationCodeType.REGISTRATION,
      );

      return { success: true };
    } catch {
      throw new InternalServerErrorException('Unable to register user');
    }
  }
}
