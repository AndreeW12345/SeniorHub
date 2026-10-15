import {
  deleteField,
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';

import type { UserProfile, UserProfileUpdate } from '@/constants/user-profile';
import { CURRENT_LEGAL_TERMS_VERSION } from '@/constants/legal-consent';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { normalizeSwedishPhone } from '@/utils/normalize-swedish-phone';

const PHONE_ALREADY_IN_USE = 'PHONE_ALREADY_IN_USE';

export type SaveUserProfileOptions = {
  legalConsent?: {
    version: string;
  };
  /** Injected Firestore instance (integration tests / emulator only). */
  firestore?: Firestore;
  /** Overrides `Platform.OS` in profile writes (integration tests only). */
  platform?: string;
};

async function resolveFirestoreDb(injected?: Firestore): Promise<Firestore | null> {
  if (injected) {
    return injected;
  }

  const { getFirestoreDb } = await import('@/firebase/config');
  return getFirestoreDb();
}

async function resolvePlatform(override?: string): Promise<string> {
  if (override) {
    return override;
  }

  const { Platform } = await import('react-native');
  return Platform.OS;
}

function readIndexOwnerUid(data: Record<string, unknown> | undefined): string | null {
  const uid = data?.uid;
  return typeof uid === 'string' && uid.trim().length > 0 ? uid.trim() : null;
}

/** Best-effort normalized phone from stored user fields (legacy profiles may lack phoneNormalized). */
function readStoredPhoneNormalized(data: Record<string, unknown> | undefined): string | null {
  if (!data) {
    return null;
  }

  const fromField =
    typeof data.phoneNormalized === 'string' ? data.phoneNormalized.trim() : '';
  if (fromField) {
    return fromField;
  }

  const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
  return phone ? normalizeSwedishPhone(phone) : null;
}

function phoneAlreadyInUseResult(): { ok: false; errorMessage: string } {
  return {
    ok: false,
    errorMessage: 'Telefonnumret används redan av ett konto.',
  };
}

async function syncPhoneIndexForExistingUser(params: {
  db: Firestore;
  userId: string;
  userRef: ReturnType<typeof doc>;
  updatePayload: Record<string, unknown>;
  phoneNormalized: string | null;
}): Promise<void> {
  const { db, userId, userRef, updatePayload, phoneNormalized } = params;

  await runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    if (!userSnapshot.exists()) {
      throw new Error('USER_PROFILE_MISSING');
    }

    const currentData = userSnapshot.data() as Record<string, unknown>;
    const previousNormalized = readStoredPhoneNormalized(currentData);

    if (phoneNormalized) {
      const nextIndexRef = doc(db, FIRESTORE_COLLECTIONS.phoneIndex, phoneNormalized);
      const nextIndexSnapshot = await transaction.get(nextIndexRef);

      if (nextIndexSnapshot.exists()) {
        const ownerUid = readIndexOwnerUid(nextIndexSnapshot.data());
        if (ownerUid !== userId) {
          throw new Error(PHONE_ALREADY_IN_USE);
        }
      }

      if (previousNormalized && previousNormalized !== phoneNormalized) {
        const previousIndexRef = doc(db, FIRESTORE_COLLECTIONS.phoneIndex, previousNormalized);
        const previousIndexSnapshot = await transaction.get(previousIndexRef);
        if (previousIndexSnapshot.exists()) {
          const previousOwnerUid = readIndexOwnerUid(previousIndexSnapshot.data());
          if (previousOwnerUid === userId) {
            transaction.delete(previousIndexRef);
          }
        }
      }

      if (!nextIndexSnapshot.exists()) {
        transaction.set(nextIndexRef, {
          uid: userId,
          createdAt: serverTimestamp(),
        });
      }

      transaction.update(userRef, {
        ...updatePayload,
        phoneNormalized,
      });
      return;
    }

    if (previousNormalized) {
      const previousIndexRef = doc(db, FIRESTORE_COLLECTIONS.phoneIndex, previousNormalized);
      const previousIndexSnapshot = await transaction.get(previousIndexRef);
      if (previousIndexSnapshot.exists()) {
        const previousOwnerUid = readIndexOwnerUid(previousIndexSnapshot.data());
        if (previousOwnerUid === userId) {
          transaction.delete(previousIndexRef);
        }
      }
    }

    transaction.update(userRef, {
      ...updatePayload,
      phoneNormalized: deleteField(),
    });
  });
}

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

  const db = await resolveFirestoreDb(options.firestore);
  if (!db) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const platform = await resolvePlatform(options.platform);

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
    platform,
    updatedAt: serverTimestamp(),
  };

  if (photoUrl !== undefined) {
    updatePayload.photoUrl = photoUrl;
  }

  try {
    const existing = await getDocFromServer(userRef);

    if (existing.exists()) {
      const phoneNormalized = phone ? normalizeSwedishPhone(phone) : null;
      if (phone && !phoneNormalized) {
        return {
          ok: false,
          errorMessage: 'Ange ett giltigt svenskt telefonnummer.',
        };
      }

      try {
        await syncPhoneIndexForExistingUser({
          db,
          userId: trimmedId,
          userRef,
          updatePayload,
          phoneNormalized,
        });
      } catch (updateError) {
        if (updateError instanceof Error && updateError.message === PHONE_ALREADY_IN_USE) {
          return phoneAlreadyInUseResult();
        }

        throw updateError;
      }
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
          return phoneAlreadyInUseResult();
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
