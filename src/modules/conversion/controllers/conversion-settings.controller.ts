import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ConversionSettingsService } from '../services/conversion-settings.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AdminOnlyGuard } from '../guards/admin-only.guard';
import {
  type ConversionSettingsInput,
  conversionSettingsSchema,
} from '../schemas/conversion.schema';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { ApiCookieAuth } from '@nestjs/swagger';
import {
  ApiGetConversionSettings,
  ApiUpdateConversionSetting,
} from '../swagger/conversion-settings.swagger';

@Controller('/admin/conversion-settings')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class ConversionSettingsController {
  constructor(private readonly settings: ConversionSettingsService) {}

  @Get()
  @ApiGetConversionSettings()
  getSettings() {
    return this.settings.getAllSettings();
  }

  @Put()
  @ApiUpdateConversionSetting()
  async updateSetting(
    @Body(new ZodValidationPipe(conversionSettingsSchema))
    body: ConversionSettingsInput,
  ) {
    await this.settings.updateMaxFileSize(
      body.sourceFormat,
      body.maxFileSizeBytes,
    );

    return {
      message: 'Conversion settings updated successfully.',
      ...body,
    };
  }
}
