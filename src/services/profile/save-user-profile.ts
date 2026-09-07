import { doc, getDocFromServer, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import type { UserProfile, UserProfileUpdate } from '@/constants/user-profile';
import { CURRENT_LEGAL_TERMS_VERSION } from '@/constants/legal-consent';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb } from '@/firebase/config';

export type SaveUserProfileOptions = {
  legalConsent?: {
    version: string;
  };
};

/** Saves profile fields to Firestore `users/{uid}`. */
export async function saveUserProfile(
  userId: string,
  update: UserProfileUpdate,
  options: SaveUserProfileOptions = {},
): Promise<{ ok: true; profile: UserProfile } | { ok: false; errorMessage: string }> {
  const trimmedId = userId.trim();
  if (!trimmedId) {
    return { ok: false, errorMessage: 'Ingen inloggad användare.' };
  }

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

  const userRef = doc(db, FIRESTORE_COLLECTIONS.users, trimmedId);

  const updatePayload: Record<string, unknown> = {
    name,
    phone,
    email,
    platform: Platform.OS,
    updatedAt: serverTimestamp(),
  };

  if (photoUrl !== undefined) {
    updatePayload.photoUrl = photoUrl;
  }

  try {
    const existing = await getDocFromServer(userRef);

    if (existing.exists()) {
      await updateDoc(userRef, updatePayload);
    } else {
      const legalConsent = options.legalConsent;
      if (!legalConsent || legalConsent.version.trim() !== CURRENT_LEGAL_TERMS_VERSION) {
        return {
          ok: false,
          errorMessage: 'Legal consent is required before creating a new account profile.',
        };
      }

      const createPayload: Record<string, unknown> = {
        ...updatePayload,
        role: 'user',
        photoUrl: photoUrl === undefined ? null : photoUrl,
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
        termsAcceptedVersion: legalConsent.version.trim(),
        createdAt: serverTimestamp(),
      };

      try {
        await setDoc(userRef, createPayload);
      } catch (createError) {
        const retrySnapshot = await getDocFromServer(userRef);
        if (!retrySnapshot.exists()) {
          throw createError;
        }

        await updateDoc(userRef, updatePayload);
      }
    }

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
