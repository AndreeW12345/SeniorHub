import type { User } from 'firebase/auth';

import type { AdminAccount } from '@/constants/admin-account';
import { isFirebaseConfigured } from '@/firebase/config';
import { fetchAdminAccount } from '@/services/admin/fetch-admin-account';
import { isAdminEmailAllowed } from '@/services/admin/admin-email-allowlist';

export const DEFAULT_ORGANIZATION_ID = 'seniorhub';
export const DEFAULT_ORGANIZATION_NAME = 'SeniorHub';

/** @deprecated Use isAdminEmailAllowed from admin-email-allowlist.ts */
export { isAdminEmailAllowed } from '@/services/admin/admin-email-allowlist';

/**
 * Loads an existing admin profile for a signed-in password admin.
 * Admin documents must be created server-side or in Firebase Console — never from the client.
 */
export async function ensureDefaultAdminAccount(user: User): Promise<AdminAccount | null> {
  const uid = user.uid?.trim();
  if (!uid || !isFirebaseConfigured()) {
    return null;
  }

  if (!isAdminEmailAllowed(user.email)) {
    return null;
  }

  return fetchAdminAccount(uid);
}
