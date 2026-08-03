import { doc, getDoc } from 'firebase/firestore';

import type { AdminAccount } from '@/constants/admin-account';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { mapAdminAccountDocument } from '@/services/admin/map-admin-account-document';

/** Loads the signed-in admin's organization profile from `admins/{uid}`. */
export async function fetchAdminAccount(uid: string): Promise<AdminAccount | null> {
  const trimmedUid = uid.trim();

  if (!trimmedUid || !isFirebaseConfigured()) {
    return null;
  }

  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  try {
    const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.admins, trimmedUid));
    if (!snapshot.exists()) {
      return null;
    }

    return mapAdminAccountDocument(snapshot.id, snapshot.data() as Record<string, unknown>);
  } catch (error) {
    console.error('[SeniorHub] Kunde inte hämta adminprofil:', error);
    return null;
  }
}
