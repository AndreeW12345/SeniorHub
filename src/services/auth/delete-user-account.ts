import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';

import { getFirebaseFunctions } from '@/firebase/functions-instance';
import { isFirebaseConfigured } from '@/firebase/config';

export type DeleteUserAccountResult = { ok: true } | { ok: false; errorMessage: string };

function readCallableErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const message = error.message?.trim();
    if (message) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return 'Kunde inte ta bort kontot. Försök igen.';
}

/**
 * Deletes the signed-in user's account and personal data via Cloud Functions.
 * Auth user is removed server-side after Firestore/Storage cleanup.
 */
export async function deleteUserAccount(): Promise<DeleteUserAccountResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const functions = getFirebaseFunctions();
  if (!functions) {
    return { ok: false, errorMessage: 'Cloud Functions kunde inte initieras.' };
  }

  try {
    const callable = httpsCallable<Record<string, never>, { ok: true }>(
      functions,
      'deleteUserAccount',
    );
    await callable({});
    return { ok: true };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
