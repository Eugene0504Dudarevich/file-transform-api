import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuthSettingsController } from './controllers/auth-settings.controller';
import { GrantsController } from './controllers/grants.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { RolesController } from './controllers/roles.controller';
import { GrantsService } from './services/grants.service';
import { PermissionsService } from './services/permissions.service';
import { RolesService } from './services/roles.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [
    AuthSettingsController,
    GrantsController,
    PermissionsController,
    RolesController,
  ],
  providers: [GrantsService, PermissionsService, RolesService, JwtAuthGuard],
})
export class AdminModule {}
