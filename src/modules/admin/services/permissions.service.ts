import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { RbacService } from '../../rbac/services/rbac.service.js';
import {
  CreatePermissionInput,
  UpdatePermissionInput,
} from '../schemas/permission.schema.js';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreatePermissionInput) {
    const existing = await this.prisma.permission.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictException('Permission with this name already exists');
    }

    const permission = await this.prisma.permission.create({
      data,
    });

    await this.rbacService.invalidateCache();

    return permission;
  }

  async update(permissionId: string, data: UpdatePermissionInput) {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (data.name) {
      const existing = await this.prisma.permission.findFirst({
        where: { name: data.name, id: { not: permissionId } },
      });

      if (existing) {
        throw new ConflictException('Permission with this name already exists');
      }

      const updated = await this.prisma.permission.update({
        where: { id: permissionId },
        data,
      });

      await this.rbacService.invalidateCache();

      return updated;
    }
  }

  async remove(permissionId: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const grants = await this.prisma.grant.count({
      where: { permissionId },
    });

    if (grants > 0) {
      throw new ConflictException(
        'Cannot delete permission with active grants',
      );
    }

    await this.prisma.permission.delete({
      where: { id: permissionId },
    });

    await this.rbacService.invalidateCache();

    return {
      success: true,
    };
  }
}
