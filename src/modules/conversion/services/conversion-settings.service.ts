import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { FileFormat } from '../types/conversion.types';
import { DEFAULT_LIMITS } from '../constants/conversion.constants';

@Injectable()
export class ConversionSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMaxFileSize(format: FileFormat): Promise<number> {
    const setting = await this.prisma.conversionSetting.findUnique({
      where: {
        sourceFormat: format,
      },
    });

    return setting?.maxFileSizeBytes ?? DEFAULT_LIMITS[format];
  }

  async updateMaxFileSize(
    format: FileFormat,
    maxFileSizeBytes: number,
  ): Promise<void> {
    await this.prisma.conversionSetting.upsert({
      where: {
        sourceFormat: format,
      },
      create: {
        sourceFormat: format,
        maxFileSizeBytes,
      },
      update: {
        maxFileSizeBytes,
      },
    });
  }

  async getAllSettings() {
    const settings = await this.prisma.conversionSetting.findMany();

    return (
      DEFAULT_LIMITS &&
      Object.entries(DEFAULT_LIMITS).map(([sourceFormat, defaultLimit]) => {
        const setting = settings.find(
          (item) => item.sourceFormat === sourceFormat,
        );

        return {
          sourceFormat,
          maxFileSizeBytes: setting?.maxFileSizeBytes ?? defaultLimit,
        };
      })
    );
  }
}
