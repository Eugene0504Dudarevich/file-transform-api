import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RbacConfig } from '../types/rbac.types.js';
import { PrismaService } from '@/core/database/prisma.service';
import { RbacAction } from '../constants/rbac.constants.js';

@Injectable()
export class RbacService implements OnModuleInit {
  private readonly logger = new Logger(RbacService.name);

  private config: RbacConfig = {
    permissions: new Map(),
    grants: new Map(),
  };

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    const [permissions, grants] = await Promise.all([
      this.prisma.permission.findMany({
        select: {
          id: true,
          name: true,
          actions: true,
        },
      }),
      this.prisma.grant.findMany({
        select: {
          roleId: true,
          permissionId: true,
          actions: true,
        },
      }),
    ]);

    const permissionsMap = new Map<string, Set<RbacAction>>();
    const permissionNamesById = new Map<string, string>();

    for (const permission of permissions) {
      permissionsMap.set(
        permission.name,
        new Set(permission.actions as RbacAction[]),
      );
      permissionNamesById.set(permission.id, permission.name);
    }

    const grantsMap = new Map<string, Map<string, Set<RbacAction> | null>>();

    for (const grant of grants) {
      const permissionName = permissionNamesById.get(grant.permissionId);

      if (!permissionName) {
        this.logger.warn(
          `Grant ${grant.permissionId} references unknown permission ${grant.permissionId}`,
        );

        continue;
      }

      if (!grantsMap.has(grant.roleId)) {
        grantsMap.set(grant.roleId, new Map());
      }

      const roleGrants = grantsMap.get(grant.roleId)!;
      roleGrants.set(
        permissionName,
        grant.actions.length === 0
          ? null
          : new Set(grant.actions as RbacAction[]),
      );
    }

    this.config = {
      permissions: permissionsMap,
      grants: grantsMap,
    };

    this.logger.log(
      `RBAC configuration reloaded: ${permissions.length} permissions, ${grants.length} grants`,
    );
  }

  async invalidateCache(): Promise<void> {
    this.logger.log('Invalidating RBAC cache');

    await this.reload();
  }

  hasPermission(
    roleIds: string[],
    permissionName: string,
    action: RbacAction,
  ): boolean {
    const permission = this.config.permissions.get(permissionName);

    if (!permission || !permission.has(action)) return false;

    for (const roleId of roleIds) {
      const roleGrants = this.config.grants.get(roleId);

      if (!roleGrants) continue;

      const grant = roleGrants.get(permissionName);

      if (grant === undefined) continue;

      if (grant === null || grant.has(action)) return true;
    }

    return false;
  }
}
