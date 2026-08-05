import {
  onAuthStateChanged,
  signOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';

import { getFirebaseAuth } from '@/firebase';
import { getAuthErrorCode, getSwedishAuthErrorMessage } from '@/services/auth/errors';
import type { AuthActionResult } from '@/services/auth/providers/types';

/** Signs the current Firebase Auth user out. */
export async function signOutCurrentUser(): Promise<AuthActionResult> {
  const auth = getFirebaseAuth();

  if (!auth) {
    return {
      ok: false,
      errorMessage: 'Firebase är inte konfigurerat. Kontrollera .env-inställningarna.',
    };
  }

  try {
    await signOut(auth);
    return { ok: true };
  } catch (error) {
    console.error('[SeniorHub] Utloggning misslyckades:', error);
    return {
      ok: false,
      errorMessage: getSwedishAuthErrorMessage(getAuthErrorCode(error)),
    };
  }
}

/**
 * Subscribes to Firebase auth state changes.
 * Calls `callback` immediately with the current user (or null).
 */
export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  const auth = getFirebaseAuth();

  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export function getCurrentAuthUser(): User | null {
  return getFirebaseAuth()?.currentUser ?? null;
}
