import type { Functions } from 'firebase/functions';

import { ensureFirebaseAppCheckReady, isFirebaseConfigured } from '@/firebase/config';
import { getFirebaseFunctions } from '@/firebase/functions-instance';

export type PreparePublicCallableRequestResult =
  | { ok: true; functions: Functions }
  | { ok: false; errorMessage: string };

/**
 * Prepares an unauthenticated Cloud Functions call (App Check only).
 */
export async function preparePublicCallableRequest(): Promise<PreparePublicCallableRequestResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
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
