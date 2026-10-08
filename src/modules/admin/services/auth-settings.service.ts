import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';

@Injectable()
export class AuthSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return await this.prisma.authSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    });
  }

  async isRegistrationVerificationEnabled(): Promise<boolean> {
    const settings = await this.getSettings();

    return settings.registrationVerificationEnabled;
  }

  async setRegistrationVerification(enabled: boolean) {
    return await this.prisma.authSettings.upsert({
      where: { id: 'default' },
      update: {
        registrationVerificationEnabled: enabled,
      },
      create: {
        id: 'default',
        registrationVerificationEnabled: enabled,
      },
    });
  }

  async isLoginVerificationEnabled(): Promise<boolean> {
    const settings = await this.getSettings();

    return settings.loginVerificationEnabled;
  }

  async setLoginVerification(enabled: boolean) {
    return this.prisma.authSettings.upsert({
      where: { id: 'default' },
      update: {
        loginVerificationEnabled: enabled,
      },
      create: {
        id: 'default',
        loginVerificationEnabled: enabled,
      },
    });
  }
}
