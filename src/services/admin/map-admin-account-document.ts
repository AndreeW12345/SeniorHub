import type { AdminAccount } from '@/constants/admin-account';
import { normalizeAdminRole } from '@/constants/admin-account';

type FirestoreAdminData = Record<string, unknown>;

function readString(data: FirestoreAdminData, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/** Maps a Firestore admin document to AdminAccount, or null if required fields are missing. */
export function mapAdminAccountDocument(
  uid: string,
  data: FirestoreAdminData,
): AdminAccount | null {
  const trimmedUid = uid.trim();
  const organizationId = readString(data, 'organizationId');

  if (!trimmedUid || !organizationId) {
    return null;
  }

  return {
    uid: trimmedUid,
    organizationId,
    role: normalizeAdminRole(data.role),
    email: readString(data, 'email') ?? undefined,
    displayName: readString(data, 'displayName') ?? undefined,
  };
}
