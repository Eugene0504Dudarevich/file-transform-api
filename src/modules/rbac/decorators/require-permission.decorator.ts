import { SetMetadata } from '@nestjs/common';
import {
  RBAC_PERMISSION_METADATA,
  RbacAction,
} from '../constants/rbac.constants.js';

export const RequirePermission = (permission: string, action: RbacAction) =>
  SetMetadata(RBAC_PERMISSION_METADATA, {
    permission,
    action,
  });
