import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@/database/prisma/generated/prisma/client';
import { z } from 'zod';
import { EmailService } from '@/common/services/email.service';
import { OtpService } from '@/common/services/otp.service';
import { PrismaService } from '@/core/database/prisma.service';
import { RbacService } from '@/modules/rbac/services/rbac.service';
import {
  filterUserProfile,
  USER_PROFILE_FIELDS,
} from '../policies/user-profile.policy';
import { UserListQuery } from '../schemas/user-list-query.schema';
import { UpdatedUserInput } from '../schemas/update-user.schema';
import {
  ConfirmEmailChangeInput,
  InitiateEmailChangeInput,
} from '../schemas/email-change.schema';
import { VerificationCodeType } from '@/common/types/verification-code.type';
import { UserListResponse } from '../types/user-list.type';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async findAll(query: UserListQuery): Promise<UserListResponse> {
    const where: Prisma.UserWhereInput = {};

    if (query.status) {
      where.status = query.status.toUpperCase() as
        'PENDING' | 'ACTIVE' | 'BLOCKED';
    }

    if (query.q) {
      const searchConditions: Prisma.UserWhereInput[] = [
        {
          email: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
      ];

      if (this.zUuidIsValid(query.q)) {
        searchConditions.push({ id: query.q });
      }

      where.OR = searchConditions;
    }

    const order = query.order;

    const orderBy: Prisma.UserOrderByWithRelationInput[] = [];

    if (query.sort === 'email') {
      orderBy.push({ email: order }, { id: order });
    } else if (query.sort === 'last_login') {
      orderBy.push(
        { lastLoginAt: { sort: order, nulls: 'last' } },
        { id: order },
      );
    } else {
      orderBy.push({ createdAt: order }, { id: order });
    }

    if (query.cursor) {
      const cursorUser = await this.prisma.user.findUnique({
        where: { id: query.cursor },
        select: { id: true },
      });

      if (!cursorUser) {
        throw new BadRequestException('Invalid pagination cursor');
      }
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy,
      take: query.limit + 1,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        email: true,
        photoUrl: true,
        createdAt: true,
        status: true,
        lastLoginAt: true,
      },
    });

    const hasMore = users.length > query.limit;
    const page = users.slice(0, query.limit);

    return {
      items: page,
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  private zUuidIsValid(value: string): boolean {
    return z.uuid().safeParse(value).success;
  }

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

    const roleIds = await this.getRoleIds(viewerUserId);
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

  async updateUserProfile(
    actorUserId: string,
    targetUserId: string,
    input: UpdatedUserInput,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const isSelf = actorUserId === targetUserId;
    const roleIds = await this.getRoleIds(actorUserId);

    const canUpdateUsers = this.rbacService.hasPermission(
      roleIds,
      'users',
      'update',
    );

    if (!isSelf && !canUpdateUsers) {
      throw new ForbiddenException(
        'User does not have permission to update this profile',
      );
    }

    if (isSelf && Object.hasOwn(input, 'email')) {
      throw new ForbiddenException(
        'Email may be changed through the email verification flow',
      );
    }

    if (input.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });

      if (existing && existing.id !== targetUserId) {
        throw new ConflictException('Email is already in use');
      }
    }

    const data: Prisma.UserUpdateInput = {};

    if (input.photo) {
      data.photoUrl = input.photo;
    }

    if (input.email) {
      data.email = input.email;
      data.emailVerified = new Date();
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id: targetUserId },
        data,
        select: {
          id: true,
          email: true,
          photoUrl: true,
          updatedAt: true,
        },
      });

      this.logAudit({
        event: 'user.profile.updated',
        actorUserId,
        targetUserId,
        fields: Object.keys(data),
        result: 'success',
      });

      return {
        id: updated.id,
        email: updated.email,
        photo: updated.photoUrl,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email is already in use');
      }

      this.logAudit({
        event: 'user.profile.updated',
        actorUserId,
        targetUserId,
        fields: Object.keys(data),
        result: 'failure',
      });

      throw new InternalServerErrorException('Unable to update user profile');
    }
  }

  private async getRoleIds(userId: string): Promise<string[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    return roles.map(({ roleId }) => roleId);
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  async initiateEmailChange(
    actorUserId: string,
    targetUserId: string,
    input: InitiateEmailChangeInput,
  ) {
    this.assertSelf(actorUserId, targetUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email === input.newEmail) {
      throw new ConflictException('New email is the same as the current email');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: input.newEmail },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Email is already in use');
    }

    const latestChange = await this.prisma.verificationCode.findFirst({
      where: {
        userId: actorUserId,
        type: VerificationCodeType.EMAIL_CHANGE,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const resendInterval = this.otpService.resendIntervalMilliseconds;

    if (
      latestChange?.lastSentAt &&
      Date.now() - latestChange.lastSentAt.getTime() < resendInterval
    ) {
      throw new BadRequestException(
        'Please wait before requesting another email verification code',
      );
    }

    const code = this.otpService.generateCode();
    const codeHash = this.otpService.hashCode(code);
    const now = new Date();

    const change = await this.prisma.$transaction(async (transaction) => {
      await transaction.verificationCode.updateMany({
        where: {
          userId: actorUserId,
          type: VerificationCodeType.EMAIL_CHANGE,
          consumedAt: null,
        },
        data: { consumedAt: now },
      });

      return transaction.verificationCode.create({
        data: {
          userId: actorUserId,
          type: VerificationCodeType.EMAIL_CHANGE,
          code: codeHash,
          pendingEmail: input.newEmail,
          expiresAt: this.otpService.expirationDate,
          maxAttempts: this.otpService.maxAttempts,
          lastSentAt: now,
        },
      });
    });

    try {
      await this.emailService.sendVerificationCode(
        input.newEmail,
        code,
        VerificationCodeType.EMAIL_CHANGE,
      );
    } catch (error) {
      await this.prisma.verificationCode.updateMany({
        where: {
          id: change.id,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });
      this.logAudit({
        event: 'user.email-change.email-send-failed',
        actorUserId,
        targetUserId,
        fields: ['email'],
        result: 'failure',
      });

      throw error;
    }

    this.logAudit({
      event: 'user.email-change.initiated',
      actorUserId,
      targetUserId,
      fields: ['email'],
      result: 'success',
    });

    return {
      success: true,
      requiresConfirmation: true,
      changeId: change.id,
    };
  }

  async confirmEmailChange(
    actorUserId: string,
    targetUserId: string,
    input: ConfirmEmailChangeInput,
  ) {
    this.assertSelf(actorUserId, targetUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const change = await this.prisma.verificationCode.findFirst({
      where: {
        userId: actorUserId,
        type: VerificationCodeType.EMAIL_CHANGE,
        consumedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!change?.pendingEmail) {
      throw new BadRequestException('Invalid or expired code');
    }

    const changeId = await this.otpService.verifyCodeById(
      change.id,
      VerificationCodeType.EMAIL_CHANGE,
      input.code,
    );

    try {
      const updated = await this.prisma.$transaction(async (transaction) => {
        const consumed = await transaction.verificationCode.updateMany({
          where: {
            id: changeId,
            userId: actorUserId,
            type: VerificationCodeType.EMAIL_CHANGE,
            consumedAt: null,
            expiresAt: { gt: new Date() },
            attempts: { lt: change.maxAttempts },
          },
          data: { consumedAt: new Date() },
        });

        if (consumed.count !== 1) {
          throw new BadRequestException('Invalid or expired code');
        }

        const colission = await transaction.user.findFirst({
          where: {
            email: change.pendingEmail!,
            id: { not: targetUserId },
          },
          select: { id: true },
        });

        if (colission) {
          throw new ConflictException('Email is already in use');
        }

        return transaction.user.update({
          where: { id: targetUserId },
          data: {
            email: change.pendingEmail!,
            emailVerified: new Date(),
          },
          select: {
            id: true,
            email: true,
            photoUrl: true,
            updatedAt: true,
          },
        });
      });

      this.logAudit({
        event: 'user.email-change.confirmed',
        actorUserId,
        targetUserId,
        fields: ['email'],
        result: 'success',
      });

      return {
        success: true,
        user: {
          id: updated.id,
          email: updated.email,
          photo: updated.photoUrl,
          updatedAt: updated.updatedAt,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email is already in use');
      }

      throw new InternalServerErrorException('Unable to confirm email change');
    }
  }

  private logAudit(entry: {
    event: string;
    actorUserId: string;
    targetUserId: string;
    fields: string[];
    result: 'success' | 'failure';
  }): void {
    this.logger.log(JSON.stringify(entry));
  }

  private assertSelf(actorUserId: string, targetUserId: string): void {
    if (actorUserId !== targetUserId) {
      throw new ForbiddenException('Email can only be changed by its owner');
    }
  }

  async initiateAccountDeletion(actorUserId: string, targetUserId: string) {
    this.assertSelf(actorUserId, targetUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const latestCode = await this.prisma.verificationCode.findFirst({
      where: {
        userId: targetUserId,
        type: VerificationCodeType.ACCOUNT_DELETION,
        consumedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const resendInterval = this.otpService.resendIntervalMilliseconds;

    if (
      latestCode?.lastSentAt &&
      Date.now() - latestCode.lastSentAt.getTime() < resendInterval
    ) {
      throw new BadRequestException(
        'Please wait before requesting another deletion code',
      );
    }

    const code = this.otpService.generateCode();
    const codeHash = this.otpService.hashCode(code);
    const now = new Date();

    const verificationCode = await this.prisma.$transaction(
      async (transaction) => {
        await transaction.verificationCode.updateMany({
          where: {
            userId: targetUserId,
            type: VerificationCodeType.ACCOUNT_DELETION,
            consumedAt: null,
          },
          data: { consumedAt: now },
        });

        return transaction.verificationCode.create({
          data: {
            userId: targetUserId,
            type: VerificationCodeType.ACCOUNT_DELETION,
            code: codeHash,
            expiresAt: this.otpService.expirationDate,
            maxAttempts: this.otpService.maxAttempts,
            lastSentAt: now,
          },
        });
      },
    );

    try {
      await this.emailService.sendVerificationCode(
        user.email,
        code,
        VerificationCodeType.ACCOUNT_DELETION,
      );
    } catch (error) {
      await this.prisma.verificationCode.updateMany({
        where: {
          id: verificationCode.id,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });

      this.logDeletionAudit({
        actorUserId,
        targetUserId,
        operation: 'SELF',
        result: 'failure',
        reason: 'confirmation_email_failed',
      });

      throw error;
    }

    this.logDeletionAudit({
      actorUserId,
      targetUserId,
      operation: 'SELF',
      result: 'success',
      reason: 'confirmation_requested',
    });

    return {
      success: true,
      requiresConfirmation: true,
    };
  }

  async deleteUser(
    actorUserId: string,
    targetUserId: string,
    code?: string,
  ): Promise<void> {
    const isSelf = actorUserId === targetUserId;
    const operation = isSelf ? 'SELF' : 'ADMIN';
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (isSelf) {
      if (!code) {
        throw new BadRequestException(
          'Email confirmation is required to delete your account',
        );
      }
    } else {
      const roleIds = await this.getRoleIds(actorUserId);
      const canDeleteUsers = this.rbacService.hasPermission(
        roleIds,
        'users',
        'delete',
      );

      if (!canDeleteUsers) {
        throw new ForbiddenException(
          'User does not have permission to delete this account',
        );
      }
    }

    try {
      await this.prisma.$transaction(async (transaction) => {
        if (isSelf) {
          const verificationCode = await transaction.verificationCode.findFirst(
            {
              where: {
                userId: targetUserId,
                type: VerificationCodeType.ACCOUNT_DELETION,
                consumedAt: null,
              },
              orderBy: { createdAt: 'desc' },
            },
          );

          await this.otpService.verifyCodeById(
            verificationCode?.id ?? '',
            VerificationCodeType.ACCOUNT_DELETION,
            code!,
          );

          const consumed = await transaction.verificationCode.updateMany({
            where: {
              id: verificationCode!.id,
              userId: targetUserId,
              type: VerificationCodeType.ACCOUNT_DELETION,
              consumedAt: null,
              expiresAt: { gt: new Date() },
              attempts: { lt: verificationCode!.maxAttempts },
            },
            data: { consumedAt: new Date() },
          });

          if (consumed.count !== 1) {
            throw new BadRequestException('Invalid or expired code');
          }
        }

        await transaction.userRole.deleteMany({
          where: { userId: targetUserId },
        });

        await transaction.user.delete({
          where: { id: targetUserId },
        });
      });

      this.logDeletionAudit({
        actorUserId,
        targetUserId,
        operation,
        result: 'success',
        reason: 'account_deleted',
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logDeletionAudit({
        actorUserId,
        targetUserId,
        operation,
        result: 'failure',
        reason: 'deletion_failed',
      });

      const stillExist = await this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      });

      if (!stillExist) {
        throw new NotFoundException('User not found');
      }

      throw new InternalServerErrorException('Unable to delete user account');
    }
  }

  private logDeletionAudit(entry: {
    actorUserId: string;
    targetUserId: string;
    operation: 'SELF' | 'ADMIN';
    result: 'success' | 'failure';
    reason: string;
  }): void {
    this.logger.log(
      JSON.stringify({
        event: 'user.account-deletion',
        ...entry,
      }),
    );
  }
}
