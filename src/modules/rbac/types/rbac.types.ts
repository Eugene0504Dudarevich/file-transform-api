import { RbacAction } from '../constants/rbac.constants.js';

export type RequiredPermission = {
  permission: string;
  action: RbacAction;
};

export type RbacConfig = {
  permissions: Map<string, Set<RbacAction>>;
  grants: Map<string, Map<string, Set<RbacAction> | null>>;
};
