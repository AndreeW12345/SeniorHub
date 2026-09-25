import { normalizeOrganizationId } from './organization-validation';

export type RevokeOrganizerAdminInput = {
  organizationId: string;
  targetAdminUid: string;
};

const TARGET_ADMIN_UID_PATTERN = /^[a-zA-Z0-9]{10,128}$/;

export function readTargetAdminUid(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!TARGET_ADMIN_UID_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/** Parses callable input; ignores role and other privileged fields. */
export function parseRevokeOrganizerAdminInput(data: unknown): RevokeOrganizerAdminInput | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const organizationId = normalizeOrganizationId(record.organizationId);
  const targetAdminUid = readTargetAdminUid(record.targetAdminUid);

  if (!organizationId || !targetAdminUid) {
    return null;
  }

  return { organizationId, targetAdminUid };
}
