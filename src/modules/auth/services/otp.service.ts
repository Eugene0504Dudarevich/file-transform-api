import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { createHmac, randomInt } from 'crypto';
import { VerificationCodeType } from '../types/verification-code.type';
import {
  MAX_ATTEMPTS,
  OTP_LENGTH,
  OTP_TTL_MINUTES,
} from '../constants/otp.constants.js';

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  generateCode(): string {
    return randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, '0');
  }

  hashCode(code: string): string {
    const secret = process.env.OTP_SECRET;

    if (!secret) {
      throw new Error('OTP_SECRET is not configured');
    }

    return createHmac('sha256', secret).update(code).digest('hex');
  }

  get expirationDate(): Date {
    return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  }

  get maxAttempts(): number {
    return MAX_ATTEMPTS;
  }

  async verifyCodeForUser(
    userId: string,
    type: VerificationCodeType,
    code: string,
  ): Promise<string> {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        type,
        consumedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    await this.verifyVerificationCode(verificationCode, code);

    return verificationCode!.id;
  }

  async verifyCodeById(
    verificationCodeId: string,
    type: VerificationCodeType,
    code: string,
  ): Promise<string> {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        id: verificationCodeId,
        type,
        consumedAt: null,
      },
    });

    await this.verifyVerificationCode(verificationCode, code);

    return verificationCode!.id;
  }

  private async verifyVerificationCode(
    verificationCode: {
      id: string;
      userId: string;
      code: string;
      expiresAt: Date;
      attempts: number;
      maxAttempts: number;
      consumedAt: Date | null;
    } | null,
    code: string,
  ): Promise<void> {
    if (
      !verificationCode ||
      verificationCode.expiresAt < new Date() ||
      verificationCode.consumedAt
    ) {
      throw new BadRequestException('Invalid or expired code');
    }

    if (verificationCode.attempts >= verificationCode.maxAttempts) {
      throw new BadRequestException('Too many attempts');
    }

    const codeHash = this.hashCode(code);

    if (codeHash !== verificationCode.code) {
      await this.prisma.verificationCode.update({
        where: {
          id: verificationCode.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException('Invalid or expired code');
    }
  }

  async getCodeById(verificationCodeId: string, type: VerificationCodeType) {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        id: verificationCodeId,
        type,
        consumedAt: null,
      },
    });

    if (!verificationCode || verificationCode.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired code');
    }

    if (verificationCode.attempts >= verificationCode.maxAttempts) {
      throw new BadRequestException('Too many attempts');
    }

    return verificationCode;
  }

  async consumeVerificationCode(
    verificationCodeId: string,
    type: VerificationCodeType,
  ): Promise<void> {
    try {
      await this.prisma.verificationCode.update({
        where: {
          id: verificationCodeId,
        },
        data: {
          consumedAt: new Date(),
        },
      });
    } catch {
      throw new BadRequestException(
        `Unable to verify ${type === VerificationCodeType.LOGIN ? 'login' : 'registration'}`,
      );
    }
  }
}
