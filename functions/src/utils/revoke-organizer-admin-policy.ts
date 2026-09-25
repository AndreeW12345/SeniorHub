import { HttpsError } from 'firebase-functions/v2/https';

import {
  ORGANIZER_ADMIN_ROLE,
  readExistingAdminSnapshot,
  type ExistingAdminSnapshot,
} from './invite-organizer-admin-policy';
import { isSuperAdminRole } from './super-admin-policy';

export type RevokeOrganizerAdminDecision =
  | { kind: 'revoke' }
  | {
      kind: 'rejected';
      reason:
        | 'self_revoke'
        | 'not_found'
        | 'superadmin_account'
        | 'wrong_role'
        | 'wrong_organization';
    };

export function resolveRevokeOrganizerAdminDecision(params: {
  superAdminUid: string;
  targetAdminUid: string;
  targetOrganizationId: string;
  admin: ExistingAdminSnapshot;
}): RevokeOrganizerAdminDecision {
  if (params.targetAdminUid === params.superAdminUid) {
    return { kind: 'rejected', reason: 'self_revoke' };
  }

  if (!params.admin.exists) {
    return { kind: 'rejected', reason: 'not_found' };
  }

  if (isSuperAdminRole(params.admin.role)) {
    return { kind: 'rejected', reason: 'superadmin_account' };
  }

  if (params.admin.role !== ORGANIZER_ADMIN_ROLE) {
    return { kind: 'rejected', reason: 'wrong_role' };
  }

  if (params.admin.organizationId !== params.targetOrganizationId) {
    return { kind: 'rejected', reason: 'wrong_organization' };
  }

  return { kind: 'revoke' };
}

export function revokeOrganizerAdminRejectedError(): HttpsError {
  return new HttpsError('failed-precondition', 'Administratören kunde inte tas bort.');
}

export function buildRevokeOrganizerAdminRateLimitPath(superAdminUid: string): string {
  return `security/revokeOrganizerAdmin/attempts/${superAdminUid}`;
}

export const REVOKE_ORGANIZER_ADMIN_COOLDOWN_MS = 3_000;

export { readExistingAdminSnapshot };
