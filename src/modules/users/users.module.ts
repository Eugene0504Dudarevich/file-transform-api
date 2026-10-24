import { Module } from '@nestjs/common';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { UsersController } from './controllers/users.controller';
import { EmailService } from '@/common/services/email.service';
import { OtpService } from '@/common/services/otp.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [RbacModule],
  controllers: [UsersController],
  providers: [EmailService, OtpService, UsersService],
})
export class UsersModule {}
