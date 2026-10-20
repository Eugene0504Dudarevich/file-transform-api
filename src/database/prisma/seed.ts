import { PrismaClient } from './generated/prisma/index';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORDS = {
  admin: 'Admin123!',
  editor: 'Editor123!',
  viewer: 'Viewer123!',
};

async function main() {
  const [adminPasswordHash, editorPasswordHash, viewerPasswordHash] =
    await Promise.all([
      bcrypt.hash(PASSWORDS.admin, 10),
      bcrypt.hash(PASSWORDS.editor, 10),
      bcrypt.hash(PASSWORDS.viewer, 10),
    ]);

  const adminUser = await prisma.user.upsert({
    where: {
      email: 'admin@example.com',
    },
    update: {
      password: adminPasswordHash,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
    create: {
      email: 'admin@example.com',
      password: adminPasswordHash,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });

  const editorUser = await prisma.user.upsert({
    where: {
      email: 'editor@example.com',
    },
    update: {
      password: editorPasswordHash,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
    create: {
      email: 'editor@example.com',
      password: editorPasswordHash,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: {
      email: 'viewer@example.com',
    },
    update: {
      password: viewerPasswordHash,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
    create: {
      email: 'viewer@example.com',
      password: viewerPasswordHash,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });

  console.log('Users created');

  const adminRole = await prisma.role.upsert({
    where: {
      name: 'admin',
    },
    update: {
      description: 'Full RBAC access',
    },
    create: {
      name: 'admin',
      description: 'Full RBAC access',
    },
  });

  const editorRole = await prisma.role.upsert({
    where: {
      name: 'editor',
    },
    update: {
      description: 'Can read and update roles',
    },
    create: {
      name: 'editor',
      description: 'Can read and update roles',
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: {
      name: 'viewer',
    },
    update: {
      description: 'Can only read roles',
    },
    create: {
      name: 'viewer',
      description: 'Can only read roles',
    },
  });

  console.log('Roles created');

  const rolesPermission = await prisma.permission.upsert({
    where: {
      name: 'rbac.roles',
    },
    update: {
      actions: ['read', 'create', 'update', 'delete'],
    },
    create: {
      name: 'rbac.roles',
      actions: ['read', 'create', 'update', 'delete'],
    },
  });

  const permissionsPermission = await prisma.permission.upsert({
    where: {
      name: 'rbac.permissions',
    },
    update: {
      actions: ['read', 'create', 'update', 'delete'],
    },
    create: {
      name: 'rbac.permissions',
      actions: ['read', 'create', 'update', 'delete'],
    },
  });

  const grantsPermission = await prisma.permission.upsert({
    where: {
      name: 'rbac.grants',
    },
    update: {
      actions: ['read', 'create', 'update', 'delete'],
    },
    create: {
      name: 'rbac.grants',
      actions: ['read', 'create', 'update', 'delete'],
    },
  });

  const usersPermission = await prisma.permission.upsert({
    where: { name: 'users' },
    update: {
      actions: ['read', 'create', 'update', 'delete'],
    },
    create: {
      name: 'users',
      actions: ['read', 'create', 'update', 'delete'],
    },
  });

  console.log('Permissions created');

  await prisma.grant.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: rolesPermission.id,
      },
    },
    update: {
      actions: ['read', 'create', 'update', 'delete'],
    },
    create: {
      roleId: adminRole.id,
      permissionId: rolesPermission.id,
      actions: ['read', 'create', 'update', 'delete'],
    },
  });

  await prisma.grant.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: permissionsPermission.id,
      },
    },
    update: {
      actions: ['read', 'create', 'update', 'delete'],
    },
    create: {
      roleId: adminRole.id,
      permissionId: permissionsPermission.id,
      actions: ['read', 'create', 'update', 'delete'],
    },
  });

  await prisma.grant.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: grantsPermission.id,
      },
    },
    update: {
      actions: ['read', 'create', 'update', 'delete'],
    },
    create: {
      roleId: adminRole.id,
      permissionId: grantsPermission.id,
      actions: ['read', 'create', 'update', 'delete'],
    },
  });

  await prisma.grant.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: usersPermission.id,
      },
    },
    update: {
      actions: ['read', 'create', 'update', 'delete'],
    },
    create: {
      roleId: adminRole.id,
      permissionId: usersPermission.id,
      actions: ['read', 'create', 'update', 'delete'],
    },
  });

  await prisma.grant.upsert({
    where: {
      roleId_permissionId: {
        roleId: editorRole.id,
        permissionId: rolesPermission.id,
      },
    },
    update: {
      actions: ['read', 'update'],
    },
    create: {
      roleId: editorRole.id,
      permissionId: rolesPermission.id,
      actions: ['read', 'update'],
    },
  });

  await prisma.grant.upsert({
    where: {
      roleId_permissionId: {
        roleId: viewerRole.id,
        permissionId: rolesPermission.id,
      },
    },
    update: {
      actions: ['read'],
    },
    create: {
      roleId: viewerRole.id,
      permissionId: rolesPermission.id,
      actions: ['read'],
    },
  });

  console.log('Grants created');

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: editorUser.id,
        roleId: editorRole.id,
      },
    },
    update: {},
    create: {
      userId: editorUser.id,
      roleId: editorRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: viewerUser.id,
        roleId: viewerRole.id,
      },
    },
    update: {},
    create: {
      userId: viewerUser.id,
      roleId: viewerRole.id,
    },
  });

  console.log('User roles assigned');
}

main()
  .catch((error) => {
    console.error('RBAC seed failed:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
