import { doc, getDoc } from 'firebase/firestore';

import { EMPTY_USER_PROFILE, type UserProfile } from '@/constants/user-profile';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb } from '@/firebase/config';

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Maps a Firestore user document into a profile. */
export function mapUserProfileDocument(data: Record<string, unknown> | undefined): UserProfile {
  if (!data) {
    return { ...EMPTY_USER_PROFILE };
  }

  const photoUrl = readString(data.photoUrl);

  return {
    name: readString(data.name),
    phone: readString(data.phone),
    email: readString(data.email),
    photoUrl: photoUrl || null,
  };
}

/** Loads the device user's profile from Firestore. */
export async function fetchUserProfile(
  deviceId: string,
): Promise<{ ok: true; profile: UserProfile } | { ok: false; errorMessage: string }> {
  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  try {
    const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.users, deviceId));
    return {
      ok: true,
      profile: mapUserProfileDocument(
        snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : undefined,
      ),
    };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte hämta profil:', error);
    return { ok: false, errorMessage: 'Kunde inte hämta profilen just nu.' };
  }
}
