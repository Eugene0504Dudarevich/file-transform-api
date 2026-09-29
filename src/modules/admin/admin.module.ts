import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuthSettingsController } from '@/modules/admin/controllers/auth-settings.controller';

@Module({
  imports: [AuthModule],
  controllers: [AuthSettingsController],
})
export class AdminModule {}
