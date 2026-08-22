import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { EMPTY_USER_PROFILE, type UserProfile } from '@/constants/user-profile';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirebaseAuth } from '@/firebase';
import { getFirestoreDb } from '@/firebase/config';
import { readStoredDeviceId } from '@/services/notifications';
import { mapUserProfileDocument } from '@/services/profile/fetch-user-profile';

const PROFILE_MIGRATED_KEY_PREFIX = '@seniorhub/profile-migrated-uid:';

function migratedKeyForUid(uid: string): string {
  return `${PROFILE_MIGRATED_KEY_PREFIX}${uid}`;
}

/** Exact email match for migration (trim + lowercase). Empty emails never match. */
function emailsMatchExactly(
  profileEmail: unknown,
  authEmail: string | null | undefined,
): boolean {
  if (typeof profileEmail !== 'string') {
    return false;
  }

  const left = profileEmail.trim().toLowerCase();
  const right = (authEmail ?? '').trim().toLowerCase();
  return left.length > 0 && right.length > 0 && left === right;
}

async function createEmptyUidProfile(
  uid: string,
  authEmail: string,
): Promise<UserProfile> {
  const db = getFirestoreDb();
  if (!db) {
    return { ...EMPTY_USER_PROFILE, email: authEmail };
  }

  const profile: UserProfile = {
    name: '',
    phone: '',
    email: authEmail,
    photoUrl: null,
  };

  await setDoc(
    doc(db, FIRESTORE_COLLECTIONS.users, uid),
    {
      ...profile,
      role: 'user',
      platform: Platform.OS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return profile;
}

/**
 * One-time migration from a legacy `users/device_*` profile into `users/{uid}`.
 *
 * Only copies the on-device legacy profile when its `email` exactly matches
 * `getAuth().currentUser.email`. Otherwise creates an empty `users/{uid}` profile
 * so two Auth users never share the same profile data.
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
    const uidRef = doc(db, FIRESTORE_COLLECTIONS.users, trimmedUid);
    const uidSnapshot = await getDoc(uidRef);

    if (uidSnapshot.exists()) {
      await AsyncStorage.setItem(migratedKeyForUid(trimmedUid), '1');
      return {
        ok: true,
        profile: mapUserProfileDocument(uidSnapshot.data() as Record<string, unknown>),
        migrated: false,
      };
    }

    const alreadyMarked = await AsyncStorage.getItem(migratedKeyForUid(trimmedUid));
    if (alreadyMarked === '1') {
      const profile = await createEmptyUidProfile(trimmedUid, authEmail);
      return { ok: true, profile, migrated: false };
    }

    const deviceId = await readStoredDeviceId();
    if (!deviceId || !deviceId.startsWith('device_')) {
      const profile = await createEmptyUidProfile(trimmedUid, authEmail);
      await AsyncStorage.setItem(migratedKeyForUid(trimmedUid), '1');
      return { ok: true, profile, migrated: false };
    }

    const deviceSnapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.users, deviceId));
    if (!deviceSnapshot.exists()) {
      const profile = await createEmptyUidProfile(trimmedUid, authEmail);
      await AsyncStorage.setItem(migratedKeyForUid(trimmedUid), '1');
      return { ok: true, profile, migrated: false };
    }

    const deviceData = deviceSnapshot.data() as Record<string, unknown>;

    if (!emailsMatchExactly(deviceData.email, authEmail)) {
      // Do not copy another account's (or unmatched) device profile.
      const profile = await createEmptyUidProfile(trimmedUid, authEmail);
      await AsyncStorage.setItem(migratedKeyForUid(trimmedUid), '1');
      return { ok: true, profile, migrated: false };
    }

    const profile = mapUserProfileDocument(deviceData);

    await setDoc(
      uidRef,
      {
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        photoUrl: profile.photoUrl,
        platform: Platform.OS,
        updatedAt: serverTimestamp(),
        migratedFromDeviceId: deviceId,
      },
      { merge: true },
    );

    await AsyncStorage.setItem(migratedKeyForUid(trimmedUid), '1');

    return { ok: true, profile, migrated: true };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte migrera profil till Auth UID:', error);
    return { ok: false, errorMessage: 'Kunde inte migrera profilen just nu.' };
  }
}
