import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

import type { AdminAccount } from '@/constants/admin-account';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { fetchAdminAccount } from '@/services/admin/fetch-admin-account';
import { mapAdminAccountDocument } from '@/services/admin/map-admin-account-document';

export const DEFAULT_ORGANIZATION_ID = 'seniorhub';
export const DEFAULT_ORGANIZATION_NAME = 'SeniorHub';

/** Ensures the default SeniorHub organization document exists. */
export async function ensureDefaultOrganization(): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    return false;
  }

  const db = getFirestoreDb();
  if (!db) {
    return false;
  }

  const orgRef = doc(db, FIRESTORE_COLLECTIONS.organizations, DEFAULT_ORGANIZATION_ID);
  const snapshot = await getDoc(orgRef);

  if (snapshot.exists()) {
    return false;
  }

  await setDoc(orgRef, {
    id: DEFAULT_ORGANIZATION_ID,
    name: DEFAULT_ORGANIZATION_NAME,
    slug: 'seniorhub',
    description: 'SeniorHub – aktiviteter för seniorer.',
  });

  return true;
}

/**
 * Ensures the signed-in Auth user has an `admins/{uid}` profile with
 * organizationId "seniorhub". Creates the doc if missing; only adds
 * organizationId when the field is absent on an existing doc.
 */
export async function ensureDefaultAdminAccount(user: User): Promise<AdminAccount | null> {
  const uid = user.uid?.trim();
  if (!uid || !isFirebaseConfigured()) {
    return null;
  }

  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  try {
    await ensureDefaultOrganization();

    const adminRef = doc(db, FIRESTORE_COLLECTIONS.admins, uid);
    const snapshot = await getDoc(adminRef);

    if (!snapshot.exists()) {
      const payload: Record<string, string> = {
        organizationId: DEFAULT_ORGANIZATION_ID,
        role: 'admin',
      };

      const email = user.email?.trim();
      if (email) {
        payload.email = email;
      }

      await setDoc(adminRef, payload);
      return mapAdminAccountDocument(uid, payload);
    }

    const data = snapshot.data() as Record<string, unknown>;
    const currentOrg =
      typeof data.organizationId === 'string' ? data.organizationId.trim() : '';

    if (!currentOrg) {
      await updateDoc(adminRef, { organizationId: DEFAULT_ORGANIZATION_ID });
    }

    return fetchAdminAccount(uid);
  } catch (error) {
    console.error('[SeniorHub] Kunde inte säkra standard-adminkonto:', error);
    return fetchAdminAccount(uid);
  }
}
