import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDocFromServer } from 'firebase/firestore';

import { EMPTY_USER_PROFILE, type UserProfile } from '@/constants/user-profile';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirebaseAuth } from '@/firebase';
import { getFirestoreDb } from '@/firebase/config';
import { mapUserProfileDocument } from '@/services/profile/fetch-user-profile';

const PROFILE_MIGRATED_KEY_PREFIX = '@seniorhub/profile-migrated-uid:';

function migratedKeyForUid(uid: string): string {
  return `${PROFILE_MIGRATED_KEY_PREFIX}${uid}`;
}

/**
 * Loads an existing `users/{uid}` profile when present.
 * Does not create new user documents — account creation requires legal consent elsewhere.
 */
export async function migrateDeviceProfileToUid(
  uid: string,
): Promise<{ ok: true; profile: UserProfile; migrated: boolean } | { ok: false; errorMessage: string }> {
  const trimmedUid = uid.trim();
  if (!trimmedUid) {
    return { ok: false, errorMessage: 'Ingen inloggad användare.' };
  }

  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;
  if (!currentUser || currentUser.uid !== trimmedUid) {
    return { ok: false, errorMessage: 'Ingen inloggad användare.' };
  }

  const authEmail = currentUser.email?.trim() ?? '';

  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  try {
    const uidSnapshot = await getDocFromServer(doc(db, FIRESTORE_COLLECTIONS.users, trimmedUid));

    if (uidSnapshot.exists()) {
      await AsyncStorage.setItem(migratedKeyForUid(trimmedUid), '1');
      return {
        ok: true,
        profile: mapUserProfileDocument(uidSnapshot.data() as Record<string, unknown>),
        migrated: false,
      };
    }

    return {
      ok: true,
      profile: {
        ...EMPTY_USER_PROFILE,
        email: authEmail,
      },
      migrated: false,
    };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte migrera profil till Auth UID:', error);
    return { ok: false, errorMessage: 'Kunde inte migrera profilen just nu.' };
  }
}
