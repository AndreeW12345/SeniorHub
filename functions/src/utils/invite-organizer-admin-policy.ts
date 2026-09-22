import { HttpsError } from 'firebase-functions/v2/https';

import { isSuperAdminRole, readAdminRoleFromDocument } from './super-admin-policy';

export const ORGANIZER_ADMIN_ROLE = 'admin' as const;

export type ExistingAdminSnapshot = {
  exists: boolean;
  organizationId: string | null;
  role: string | null;
};

export type InviteOrganizerAdminDecision =
  | { kind: 'provision'; writeAdminDocument: true }
  | { kind: 'already_in_organization'; writeAdminDocument: false }
  | { kind: 'rejected'; reason: 'other_organization' | 'superadmin_account' };

export function readOrganizationNameFromDocument(
  data: Record<string, unknown> | undefined,
): string | null {
  const name = data?.name;
  return typeof name === 'string' && name.trim().length > 0 ? name.trim() : null;
}

export function isExistingOrganizationDocument(
  exists: boolean,
  data: Record<string, unknown> | undefined,
): boolean {
  return exists && readOrganizationNameFromDocument(data) !== null;
}

export function readExistingAdminSnapshot(
  exists: boolean,
  data: Record<string, unknown> | undefined,
): ExistingAdminSnapshot {
  if (!exists) {
    return { exists: false, organizationId: null, role: null };
  }

  const organizationIdRaw = data?.organizationId;
  const organizationId =
    typeof organizationIdRaw === 'string' && organizationIdRaw.trim().length > 0
      ? organizationIdRaw.trim()
      : null;

  return {
    exists: true,
    organizationId,
    role: readAdminRoleFromDocument(data),
  };
}

export function resolveInviteOrganizerAdminDecision(
  admin: ExistingAdminSnapshot,
  targetOrganizationId: string,
): InviteOrganizerAdminDecision {
  if (!admin.exists) {
    return { kind: 'provision', writeAdminDocument: true };
  }

  if (isSuperAdminRole(admin.role)) {
    return { kind: 'rejected', reason: 'superadmin_account' };
  }

  if (admin.organizationId === targetOrganizationId) {
    return { kind: 'already_in_organization', writeAdminDocument: false };
  }

  return { kind: 'rejected', reason: 'other_organization' };
}

export function buildOrganizerAdminDocumentFields(input: {
  organizationId: string;
  email: string;
  displayName: string | null;
}): Record<string, string> {
  const payload: Record<string, string> = {
    organizationId: input.organizationId,
    role: ORGANIZER_ADMIN_ROLE,
    email: input.email,
  };

  if (input.displayName) {
    payload.displayName = input.displayName;
  }

  return payload;
}

export function inviteOrganizerAdminRejectedError(): HttpsError {
  return new HttpsError('failed-precondition', 'Inbjudan kunde inte skickas.');
}

export function buildInviteOrganizerRateLimitPaths(
  superAdminUid: string,
  email: string,
): { perSuperAdmin: string; perEmail: string } {
  return {
    perSuperAdmin: `security/inviteOrganizerAdmin/attempts/${superAdminUid}`,
    perEmail: `security/inviteOrganizerAdmin/email/${encodeURIComponent(email)}`,
  };
}

export const INVITE_ORGANIZER_ADMIN_SUPERADMIN_COOLDOWN_MS = 3_000;
export const INVITE_ORGANIZER_ADMIN_EMAIL_COOLDOWN_MS = 60_000;
