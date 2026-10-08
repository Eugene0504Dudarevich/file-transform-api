import { Module } from '@nestjs/common';
import { RbacService } from './services/rbac.service';
import { RbacGuard } from './guards/rbac.guard';
import { DatabaseModule } from '@/core/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [RbacService, RbacGuard],
  exports: [RbacService, RbacGuard],
})
export class RbacModule {}
