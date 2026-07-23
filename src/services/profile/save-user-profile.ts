import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import type { UserProfile, UserProfileUpdate } from '@/constants/user-profile';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb } from '@/firebase/config';

/** Saves profile fields to Firestore `users/{deviceId}` (merge-safe). */
export async function saveUserProfile(
  deviceId: string,
  update: UserProfileUpdate,
): Promise<{ ok: true; profile: UserProfile } | { ok: false; errorMessage: string }> {
  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const name = update.name.trim();
  const phone = update.phone.trim();
  const email = update.email.trim();
  const photoUrl =
    update.photoUrl === undefined
      ? undefined
      : update.photoUrl?.trim()
        ? update.photoUrl.trim()
        : null;

  try {
    const payload: Record<string, unknown> = {
      name,
      phone,
      email,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    };

    if (photoUrl !== undefined) {
      payload.photoUrl = photoUrl;
    }

    await setDoc(doc(db, FIRESTORE_COLLECTIONS.users, deviceId), payload, { merge: true });

    return {
      ok: true,
      profile: {
        name,
        phone,
        email,
        photoUrl: photoUrl === undefined ? null : photoUrl,
      },
    };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte spara profil:', error);
    return { ok: false, errorMessage: 'Kunde inte spara profilen just nu.' };
  }
}
