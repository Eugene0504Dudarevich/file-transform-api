import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { FileFormat } from '../types/conversion.types';
import { ImageFormat } from '../types/image-conversion.types';
import { DEFAULT_IMAGES_LIMITS } from '../constants/image-conversion.constants';
import { DEFAULT_LIMITS } from '../constants/conversion.constants';

type ConfigurableSourceFormat = FileFormat | ImageFormat;

const ALL_DEFAULT_LIMITS = {
  ...DEFAULT_LIMITS,
  ...DEFAULT_IMAGES_LIMITS,
};

@Injectable()
export class ConversionSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMaxFileSize(format: ConfigurableSourceFormat): Promise<number> {
    const setting = await this.prisma.conversionSetting.findUnique({
      where: {
        sourceFormat: format,
      },
    });

    return setting?.maxFileSizeBytes ?? ALL_DEFAULT_LIMITS[format];
  }

  async updateMaxFileSize(
    format: ConfigurableSourceFormat,
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
      ALL_DEFAULT_LIMITS &&
      Object.entries(ALL_DEFAULT_LIMITS).map(([sourceFormat, defaultLimit]) => {
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
