import { Module } from '@nestjs/common';
import { AdminModule } from '@/modules/admin/admin.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ConfigModule } from '@/core/config/config.module';
import { DatabaseModule } from '@/core/database/database.module';
import { HealthModule } from '@/core/health/health.module';
import { ThrottlerModule } from '@/core/throttler/throttler.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [
    AdminModule,
    AuthModule,
    ConfigModule,
    DatabaseModule,
    HealthModule,
    ThrottlerModule,
    UsersModule,
  ],
})
export class AppModule {}
