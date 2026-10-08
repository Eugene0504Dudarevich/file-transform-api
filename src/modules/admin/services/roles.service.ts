import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { RbacService } from '../../rbac/services/rbac.service.js';
import { CreateRoleInput, UpdateRoleInput } from '../schemas/role.schema.js';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateRoleInput) {
    const existing = await this.prisma.role.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = await this.prisma.role.create({
      data,
    });

    await this.rbacService.invalidateCache();

    return role;
  }

  async update(roleId: string, data: UpdateRoleInput) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (data.name) {
      const existing = await this.prisma.role.findFirst({
        where: { name: data.name, id: { not: roleId } },
      });

      if (existing) {
        throw new ConflictException('Role with this name already exists');
      }

      const updated = await this.prisma.role.update({
        where: { id: roleId },
        data,
      });

      await this.rbacService.invalidateCache();

      return updated;
    }
  }

  async remove(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const grants = await this.prisma.grant.count({
      where: { roleId },
    });

    if (grants > 0) {
      throw new ConflictException('Cannot delete role with active grants');
    }

    const users = await this.prisma.userRole.count({
      where: { roleId },
    });

    if (users > 0) {
      throw new ConflictException('Cannot delete role assigned to users');
    }

    await this.prisma.role.delete({
      where: { id: roleId },
    });

    await this.rbacService.invalidateCache();

    return {
      success: true,
    };
  }
}
