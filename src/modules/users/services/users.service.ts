import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { RbacService } from '@/modules/rbac/services/rbac.service';
import {
  filterUserProfile,
  USER_PROFILE_FIELDS,
} from '../policies/user-profile.policy';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async getUserProfile(viewerUserId: string, targetUserId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        photoUrl: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const isSelf = viewerUserId === targetUser.id;

    if (isSelf) {
      return filterUserProfile(targetUser, USER_PROFILE_FIELDS.self);
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: viewerUserId },
      select: { roleId: true },
    });
    const roleIds = userRoles.map(({ roleId }) => roleId);
    const hasPermission = this.rbacService.hasPermission(
      roleIds,
      'users',
      'read',
    );

    if (!hasPermission) {
      throw new ForbiddenException('User does not have permission');
    }

    return filterUserProfile(targetUser, USER_PROFILE_FIELDS.privileged);
  }
}
