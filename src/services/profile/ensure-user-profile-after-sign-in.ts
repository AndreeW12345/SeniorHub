import { doc, getDocFromServer } from 'firebase/firestore';

import type { PendingRegistration } from '@/constants/auth';
import { isValidPendingLegalConsent } from '@/constants/legal-consent';
import type { UserProfile } from '@/constants/user-profile';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb } from '@/firebase/config';
import { signOutCurrentUser } from '@/services/auth/session';
import {
  fetchUserProfile,
  migrateDeviceProfileToUid,
  saveUserProfile,
} from '@/services/profile';

export type EnsureUserProfileAfterSignInInput = {
  uid: string;
  authEmail: string;
  pendingRegistration: PendingRegistration | null;
};

export type EnsureUserProfileAfterSignInResult =
  | { ok: true; isNewUser: boolean; profile: UserProfile }
  | { ok: false; errorMessage: string; requiresRegistration: boolean };

async function userProfileDocumentExists(uid: string): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) {
    return false;
  }

  const snapshot = await getDocFromServer(doc(db, FIRESTORE_COLLECTIONS.users, uid));
  return snapshot.exists();
}

/**
 * Creates or updates the Firestore user profile after Magic Link sign-in.
 * New accounts require valid legal consent from pending registration.
 */
export async function ensureUserProfileAfterSignIn(
  input: EnsureUserProfileAfterSignInInput,
): Promise<EnsureUserProfileAfterSignInResult> {
  const uid = input.uid.trim();
  const authEmail = input.authEmail.trim().toLowerCase();

  if (!uid || !authEmail) {
    return { ok: false, errorMessage: 'Inloggningen kunde inte slutföras.', requiresRegistration: false };
  }

  const profileExists = await userProfileDocumentExists(uid);
  const isNewUser = !profileExists;

  if (isNewUser) {
    const pending = input.pendingRegistration;
    if (!pending || !isValidPendingLegalConsent(pending.legalConsent)) {
      await signOutCurrentUser();
      return {
        ok: false,
        errorMessage:
          'Du måste godkänna användarvillkor och integritetspolicy för att skapa konto. Gå till registrering och försök igen.',
        requiresRegistration: true,
      };
    }

    if (pending.email !== authEmail) {
      await signOutCurrentUser();
      return {
        ok: false,
        errorMessage:
          'E-postadressen matchar inte registreringen. Använd samma adress som vid registrering.',
        requiresRegistration: true,
      };
    }

    const saveResult = await saveUserProfile(
      uid,
      {
        name: `${pending.firstName} ${pending.lastName}`.trim(),
        phone: '',
        email: authEmail,
      },
      {
        legalConsent: {
          version: pending.legalConsent.version,
        },
      },
    );

    if (!saveResult.ok) {
      await signOutCurrentUser();
      return {
        ok: false,
        errorMessage: saveResult.errorMessage,
        requiresRegistration: true,
      };
    }

    return { ok: true, isNewUser: true, profile: saveResult.profile };
  }

  await migrateDeviceProfileToUid(uid);

  const existing = await fetchUserProfile(uid);
  const existingProfile = existing.ok ? existing.profile : null;
  const fullName = input.pendingRegistration
    ? `${input.pendingRegistration.firstName} ${input.pendingRegistration.lastName}`.trim()
    : existingProfile?.name?.trim() || '';

  const saveResult = await saveUserProfile(uid, {
    name: fullName,
    phone: existingProfile?.phone ?? '',
    email: authEmail,
    photoUrl: existingProfile?.photoUrl,
  });

  if (!saveResult.ok) {
    return { ok: false, errorMessage: saveResult.errorMessage, requiresRegistration: false };
  }

  return { ok: true, isNewUser: false, profile: saveResult.profile };
}
