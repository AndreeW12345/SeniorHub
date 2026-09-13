import type { Functions } from 'firebase/functions';

import { ensureFirebaseAppCheckReady, isFirebaseConfigured } from '@/firebase/config';
import { getFirebaseFunctions } from '@/firebase/functions-instance';
import { getCurrentAuthUser } from '@/services/auth/session';

export type PrepareCallableRequestResult =
  | { ok: true; functions: Functions }
  | { ok: false; errorMessage: string };

/**
 * Ensures Firebase Auth, a fresh ID token, and App Check are ready before a callable request.
 */
export async function prepareCallableRequest(): Promise<PrepareCallableRequestResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const authUser = getCurrentAuthUser();
  if (!authUser) {
    return { ok: false, errorMessage: 'Du måste vara inloggad för att fortsätta.' };
  }

  try {
    await authUser.getIdToken(true);
  } catch {
    return {
      ok: false,
      errorMessage: 'Kunde inte verifiera inloggningen. Logga in igen och försök på nytt.',
    };
  }

  const functions = getFirebaseFunctions();
  if (!functions) {
    return { ok: false, errorMessage: 'Cloud Functions kunde inte initieras.' };
  }

  try {
    await ensureFirebaseAppCheckReady();
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message.trim()
        : 'App Check kunde inte verifieras. Registrera debug-token i Firebase Console och starta om appen.';

    return { ok: false, errorMessage: message };
  }

  return { ok: true, functions };
}
