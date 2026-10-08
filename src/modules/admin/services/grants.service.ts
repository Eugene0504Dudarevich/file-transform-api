import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { RbacService } from '../../rbac/services/rbac.service.js';
import { CreateGrantInput, UpdateGrantInput } from '../schemas/grant.schema.js';

@Injectable()
export class GrantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async finAll() {
    return this.prisma.grant.findMany({
      include: {
        role: true,
        permission: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: CreateGrantInput) {
    const role = await this.prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permission = await this.prisma.permission.findUnique({
      where: { id: data.permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const existing = await this.prisma.grant.findUnique({
      where: {
        roleId_permissionId: {
          roleId: data.roleId,
          permissionId: data.permissionId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Grant already exists for this role and permission',
      );
    }

    const actions = data.actions ?? [];
    const invalidActions = actions.filter(
      (action) => !permission.actions.includes(action),
    );

    if (invalidActions.length > 0) {
      throw new ConflictException(
        `Actions are not allowed by this permission: ${invalidActions.join(', ')}`,
      );
    }

    const grant = await this.prisma.grant.create({
      data: {
        roleId: data.roleId,
        permissionId: data.permissionId,
        actions,
      },
      include: {
        role: true,
        permission: true,
      },
    });

    await this.rbacService.invalidateCache();

    return grant;
  }

  async update(grantId: string, data: UpdateGrantInput) {
    const grant = await this.prisma.grant.findUnique({
      where: { id: grantId },
      include: { permission: true },
    });

    if (!grant) {
      throw new NotFoundException('Grant not found');
    }

    const actions = data.actions ?? [];
    const invalidActions = actions.filter(
      (action) => !grant.permission.actions.includes(action),
    );

    if (invalidActions.length > 0) {
      throw new ConflictException(
        `Actions are not allowed by this permission: ${invalidActions.join(', ')}`,
      );
    }

    const updated = await this.prisma.grant.update({
      where: { id: grantId },
      data: { actions },
      include: {
        role: true,
        permission: true,
      },
    });

    await this.rbacService.invalidateCache();

    return updated;
  }

  async remove(grantId: string) {
    const grant = await this.prisma.grant.findUnique({
      where: { id: grantId },
    });

    if (!grant) {
      throw new NotFoundException('Grant not found');
    }

    await this.prisma.grant.delete({
      where: { id: grantId },
    });

    await this.rbacService.invalidateCache();

    return {
      success: true,
    };
  }
}
