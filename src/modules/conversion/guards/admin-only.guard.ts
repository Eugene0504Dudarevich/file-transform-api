import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-user.type';
import { ROLE_NAMES } from '@/modules/rbac/constants/rbac.constants';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const adminRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          name: ROLE_NAMES.ADMIN,
        },
      },
    });

    if (!adminRole) {
      throw new ForbiddenException('Administrator access required.');
    }

    return true;
  }
}
