export const RBAC_ACTIONS = ['create', 'read', 'update', 'delete'] as const;

export type RbacAction = (typeof RBAC_ACTIONS)[number];

export const RBAC_PERMISSION_METADATA = 'rbac_permission';
