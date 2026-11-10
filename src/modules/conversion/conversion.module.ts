import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { ConversionController } from './controllers/conversion.controller';
import { ConversionSettingsController } from './controllers/conversion-settings.controller';
import { ImageConversionController } from './controllers/image-conversion.controller';
import { AdminOnlyGuard } from './guards/admin-only.guard';
import { ConversionService } from './services/conversion.service';
import { ConversionSettingsService } from './services/conversion-settings.service';
import { FormatConverterService } from './services/format-converter.service';
import { ImageConverterService } from './services/image-converter.service';
import { ImageConversionService } from './services/image-conversion.service';
import { SvgValidatorService } from './services/svg-validator.service';

@Module({
  imports: [AuthModule],
  controllers: [
    ConversionController,
    ConversionSettingsController,
    ImageConversionController,
  ],
  providers: [
    AdminOnlyGuard,
    ConversionService,
    ConversionSettingsService,
    FormatConverterService,
    ImageConverterService,
    ImageConversionService,
    SvgValidatorService,
  ],
})
export class ConversionModule {}
