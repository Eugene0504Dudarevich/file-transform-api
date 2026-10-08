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
import { RolesService } from '../services/roles.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RbacGuard } from '@/modules/rbac/guards/rbac.guard';
import { RequirePermission } from '@/modules/rbac/decorators/require-permission.decorator';
import {
  type CreateRoleInput,
  creteRoleSchema,
  type UpdateRoleInput,
  updateRoleSchema,
} from '@/modules/admin/schemas/role.schema';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  ApiCreateRole,
  ApiDeleteRole,
  ApiGetRoles,
  ApiUpdateRole,
} from '../swagger/roles.swagger';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('admin/rbac/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission('rbac.roles', 'read')
  @ApiGetRoles()
  findAll() {
    return this.rolesService.findAll();
  }

  @Post()
  @RequirePermission('rbac.roles', 'create')
  @ApiCreateRole()
  create(
    @Body(new ZodValidationPipe(creteRoleSchema))
    body: CreateRoleInput,
  ) {
    return this.rolesService.create(body);
  }

  @Put(':roleId')
  @RequirePermission('rbac.roles', 'update')
  @ApiUpdateRole()
  update(
    @Param('roleId')
    roleId: string,
    @Body(new ZodValidationPipe(updateRoleSchema))
    body: UpdateRoleInput,
  ) {
    return this.rolesService.update(roleId, body);
  }

  @Delete(':roleId')
  @RequirePermission('rbac.roles', 'delete')
  @ApiDeleteRole()
  remove(@Param('roleId') roleId: string) {
    return this.rolesService.remove(roleId);
  }
}
