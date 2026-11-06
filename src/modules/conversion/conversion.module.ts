import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { ConversionController } from './controllers/conversion.controller';
import { ConversionSettingsController } from './controllers/conversion-settings.controller';
import { AdminOnlyGuard } from './guards/admin-only.guard';
import { ConversionService } from './services/conversion.service';
import { ConversionSettingsService } from './services/conversion-settings.service';
import { FormatConverterService } from './services/format-converter.service';

@Module({
  imports: [AuthModule],
  controllers: [ConversionController, ConversionSettingsController],
  providers: [
    AdminOnlyGuard,
    ConversionService,
    ConversionSettingsService,
    FormatConverterService,
  ],
})
export class ConversionModule {}
