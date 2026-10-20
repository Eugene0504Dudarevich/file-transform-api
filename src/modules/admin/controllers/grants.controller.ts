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
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RbacGuard } from '@/modules/rbac/guards/rbac.guard';
import { GrantsService } from '../services/grants.service';
import { RequirePermission } from '@/modules/rbac/decorators/require-permission.decorator';
import {
  ApiCreateGrant,
  ApiDeleteGrant,
  ApiGetGrants,
  ApiUpdateGrant,
} from '@/modules/admin/swagger/grants.swagger';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  type CreateGrantInput,
  createGrantSchema,
  type UpdateGrantInput,
  updateGrantSchema,
} from '@/modules/admin/schemas/grant.schema';
import { ApiCookieAuth } from '@nestjs/swagger';

@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('admin/rbac/grants')
export class GrantsController {
  constructor(private readonly grantsService: GrantsService) {}

  @Get()
  @RequirePermission('rbac.grants', 'read')
  @ApiGetGrants()
  findAll() {
    return this.grantsService.finAll();
  }

  @Post()
  @RequirePermission('rbac.grants', 'create')
  @ApiCreateGrant()
  create(
    @Body(new ZodValidationPipe(createGrantSchema))
    body: CreateGrantInput,
  ) {
    return this.grantsService.create(body);
  }

  @Put(':grantId')
  @RequirePermission('rbac.grants', 'update')
  @ApiUpdateGrant()
  update(
    @Param('grantId') grantId: string,
    @Body(new ZodValidationPipe(updateGrantSchema))
    body: UpdateGrantInput,
  ) {
    return this.grantsService.update(grantId, body);
  }

  @Delete(':grantId')
  @RequirePermission('rbac.grants', 'delete')
  @ApiDeleteGrant()
  remove(@Param('grantId') grantId: string) {
    return this.grantsService.remove(grantId);
  }
}
