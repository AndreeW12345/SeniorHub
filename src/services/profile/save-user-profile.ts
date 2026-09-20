import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Platform } from 'react-native';

import type { UserProfile, UserProfileUpdate } from '@/constants/user-profile';
import { CURRENT_LEGAL_TERMS_VERSION } from '@/constants/legal-consent';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb } from '@/firebase/config';
import { normalizeSwedishPhone } from '@/utils/normalize-swedish-phone';

const PHONE_ALREADY_IN_USE = 'PHONE_ALREADY_IN_USE';

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

  const db = await getFirestoreDb();
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

      const phoneNormalized = phone ? normalizeSwedishPhone(phone) : null;
      if (phone && !phoneNormalized) {
        return {
          ok: false,
          errorMessage: 'Ange ett giltigt svenskt telefonnummer.',
        };
      }

      if (phoneNormalized) {
        createPayload.phoneNormalized = phoneNormalized;
      }

      try {
        if (phoneNormalized) {
          await runTransaction(db, async (transaction) => {
            const phoneIndexRef = doc(db, FIRESTORE_COLLECTIONS.phoneIndex, phoneNormalized);
            const phoneIndexSnapshot = await transaction.get(phoneIndexRef);
            if (phoneIndexSnapshot.exists()) {
              throw new Error(PHONE_ALREADY_IN_USE);
            }

            transaction.set(phoneIndexRef, {
              uid: trimmedId,
              createdAt: serverTimestamp(),
            });
            transaction.set(userRef, createPayload);
          });
        } else {
          await setDoc(userRef, createPayload);
        }
      } catch (createError) {
        if (createError instanceof Error && createError.message === PHONE_ALREADY_IN_USE) {
          return {
            ok: false,
            errorMessage: 'Telefonnumret används redan av ett konto.',
          };
        }

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
