import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { createHmac, randomInt } from 'crypto';
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

  async verifyRegistrationCode(userId: string, code: string): Promise<void> {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        type: 'REGISTRATION',
        consumedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationCode || verificationCode.expiresAt < new Date()) {
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

    try {
      await this.prisma.verificationCode.update({
        where: {
          id: verificationCode.id,
        },
        data: {
          consumedAt: new Date(),
        },
      });
    } catch {
      throw new BadRequestException('Unable to verify registration');
    }
  }
}
