import { Module } from '@nestjs/common';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';

@Module({
  imports: [RbacModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
