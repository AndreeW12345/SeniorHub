import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';

import { getFirebaseAuth } from '@/firebase';

export type SignInResult = { ok: true; user: User } | { ok: false; errorMessage: string };
export type SignOutResult = { ok: true } | { ok: false; errorMessage: string };

/** Maps Firebase auth error codes to friendly Swedish messages. */
function getSwedishAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-postadressen har fel format.';
    case 'auth/missing-password':
      return 'Ange ett lösenord.';
    case 'auth/user-disabled':
      return 'Kontot är inaktiverat. Kontakta administratören.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Fel e-postadress eller lösenord.';
    case 'auth/too-many-requests':
      return 'För många försök. Vänta en stund och försök igen.';
    case 'auth/network-request-failed':
      return 'Ingen anslutning. Kontrollera din internetuppkoppling.';
    default:
      return 'Inloggningen misslyckades. Försök igen.';
  }
}

/** Reads the error code from an unknown thrown value. */
function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string') {
      return code;
    }
  }

  return 'auth/unknown';
}

/** Signs an admin in with email and password. */
export async function signInAdmin(email: string, password: string): Promise<SignInResult> {
  const auth = getFirebaseAuth();

  if (!auth) {
    return {
      ok: false,
      errorMessage: 'Firebase är inte konfigurerat. Kontrollera .env-inställningarna.',
    };
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { ok: true, user: credential.user };
  } catch (error) {
    console.error('[SeniorHub] Inloggning misslyckades:', error);
    return { ok: false, errorMessage: getSwedishAuthErrorMessage(getErrorCode(error)) };
  }
}

/** Signs the current user out via Firebase Auth `signOut(auth)`. */
export async function signOutAdmin(): Promise<SignOutResult> {
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
      errorMessage: 'Kunde inte logga ut just nu. Försök igen.',
    };
  }
}

/**
 * Subscribes to Firebase auth state changes.
 *
 * Calls `callback` immediately with the current user (or null) and again on
 * every future change. Returns an unsubscribe function; when Firebase is not
 * configured it reports "no user" and returns a no-op unsubscribe.
 */
export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  const auth = getFirebaseAuth();

  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}
