import { ORGANIZER_ADMIN_ROLE } from './invite-organizer-admin-policy';
import { isSuperAdminRole, readAdminRoleFromDocument } from './super-admin-policy';

export type OrganizationAdminListItem = {
  uid: string;
  email: string | null;
  displayName: string | null;
  organizationId: string;
  role: typeof ORGANIZER_ADMIN_ROLE;
};

const PUBLIC_ADMIN_LIST_KEYS = new Set([
  'uid',
  'email',
  'displayName',
  'organizationId',
  'role',
]);

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function mapAdminDocumentToListItem(
  uid: string,
  data: Record<string, unknown> | undefined,
  expectedOrganizationId: string,
): OrganizationAdminListItem | null {
  const trimmedUid = uid.trim();
  if (!trimmedUid || !data) {
    return null;
  }

  const role = readAdminRoleFromDocument(data);
  if (isSuperAdminRole(role) || role !== ORGANIZER_ADMIN_ROLE) {
    return null;
  }

  const organizationIdRaw = data.organizationId;
  const organizationId =
    typeof organizationIdRaw === 'string' && organizationIdRaw.trim().length > 0
      ? organizationIdRaw.trim()
      : null;

  if (!organizationId || organizationId !== expectedOrganizationId) {
    return null;
  }

  return {
    uid: trimmedUid,
    email: readOptionalString(data.email),
    displayName: readOptionalString(data.displayName),
    organizationId,
    role: ORGANIZER_ADMIN_ROLE,
  };
}

/** Maps in-memory admin rows for tests and deterministic sorting. */
export function listOrganizationAdminsFromRecords(
  records: { uid: string; data: Record<string, unknown> | undefined }[],
  organizationId: string,
): OrganizationAdminListItem[] {
  return records
    .map((record) => mapAdminDocumentToListItem(record.uid, record.data, organizationId))
    .filter((item): item is OrganizationAdminListItem => item !== null)
    .sort((a, b) => {
      const emailA = a.email ?? '';
      const emailB = b.email ?? '';
      if (emailA !== emailB) {
        return emailA.localeCompare(emailB, 'sv');
      }
      return a.uid.localeCompare(b.uid, 'sv');
    });
}

export function sanitizeOrganizationAdminListItem(
  item: OrganizationAdminListItem,
): OrganizationAdminListItem {
  const sanitized: OrganizationAdminListItem = {
    uid: item.uid,
    email: item.email,
    displayName: item.displayName,
    organizationId: item.organizationId,
    role: item.role,
  };

  for (const key of Object.keys(sanitized)) {
    if (!PUBLIC_ADMIN_LIST_KEYS.has(key)) {
      delete (sanitized as Record<string, unknown>)[key];
    }
  }

  return sanitized;
}

export const LIST_ORGANIZATION_ADMINS_COOLDOWN_MS = 3_000;

export function buildListOrganizationAdminsRateLimitPath(superAdminUid: string): string {
  return `security/listOrganizationAdmins/attempts/${superAdminUid}`;
}
