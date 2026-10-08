import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/core/database/prisma.service';
import { RbacService } from '../services/rbac.service.js';
import { RBAC_PERMISSION_METADATA } from '../constants/rbac.constants.js';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride(
      RBAC_PERMISSION_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User is not authorized');
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    const roleIds = userRoles.map(({ roleId }) => roleId);
    const hasPermission = this.rbacService.hasPermission(
      roleIds,
      requiredPermission.permission,
      requiredPermission.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
