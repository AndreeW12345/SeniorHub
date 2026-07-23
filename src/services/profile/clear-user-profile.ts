import { deleteField, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb } from '@/firebase/config';

/**
 * Clears personal profile fields on the device user document.
 * Keeps push-token fields when present so notifications can keep working.
 */
export async function clearUserProfileFields(
  deviceId: string,
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  try {
    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.users, deviceId),
      {
        name: deleteField(),
        phone: deleteField(),
        email: deleteField(),
        photoUrl: deleteField(),
        platform: Platform.OS,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte rensa profil:', error);
    return { ok: false, errorMessage: 'Kunde inte ta bort kontouppgifterna just nu.' };
  }
}
