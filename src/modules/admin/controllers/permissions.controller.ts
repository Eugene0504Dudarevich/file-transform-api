import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RbacGuard } from '@/modules/rbac/guards/rbac.guard';
import { RequirePermission } from '@/modules/rbac/decorators/require-permission.decorator';
import {
  ApiCreatePermission,
  ApiDeletePermission,
  ApiGetPermissions,
  ApiUpdatePermission,
} from '@/modules/admin/swagger/permissions.swagger';
import {
  type CreatePermissionInput,
  createPermissionSchema,
  type UpdatePermissionInput,
  updatePermissionSchema,
} from '@/modules/admin/schemas/permission.schema';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('admin/rbac/permissions')
export class PermissionsController {
  constructor(private readonly permissionService: PermissionsService) {}

  @Get()
  @RequirePermission('rbac.permissions', 'read')
  @ApiGetPermissions()
  findAll() {
    return this.permissionService.findAll();
  }

  @Post()
  @RequirePermission('rbac.permissions', 'create')
  @ApiCreatePermission()
  create(
    @Body(new ZodValidationPipe(createPermissionSchema))
    body: CreatePermissionInput,
  ) {
    return this.permissionService.create(body);
  }

  @Put(':permissionId')
  @RequirePermission('rbac.permissions', 'update')
  @ApiUpdatePermission()
  update(
    @Param('permissionId') permissionId: string,
    @Body(new ZodValidationPipe(updatePermissionSchema))
    body: UpdatePermissionInput,
  ) {
    return this.permissionService.update(permissionId, body);
  }

  @Delete(':permissionId')
  @RequirePermission('rbac.permissions', 'delete')
  @ApiDeletePermission()
  remove(@Param('permissionId') permissionId: string) {
    return this.permissionService.remove(permissionId);
  }
}
