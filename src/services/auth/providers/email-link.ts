import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  type ActionCodeSettings,
} from 'firebase/auth';

import {
  EMAIL_FOR_SIGN_IN_STORAGE_KEY,
  PENDING_REGISTRATION_STORAGE_KEY,
  type PendingRegistration,
} from '@/constants/auth';
import { getFirebaseAuth } from '@/firebase';
import { getAuthErrorCode, getSwedishAuthErrorMessage } from '@/services/auth/errors';
import type { AuthActionResult, AuthProviderModule, AuthResult } from '@/services/auth/providers/types';
import { getAppBundleId, getEmailLinkContinueUrl } from '@/utils/auth-continue-url';

export const emailLinkProvider: AuthProviderModule = {
  id: 'email_link',
  label: 'Inloggningslänk via e-post',
  isAvailable: true,
};

function buildActionCodeSettings(): ActionCodeSettings {
  const bundleId = getAppBundleId();

  return {
    url: getEmailLinkContinueUrl(),
    handleCodeInApp: true,
    iOS: {
      bundleId,
    },
    android: {
      packageName: bundleId,
      installApp: true,
      minimumVersion: '1',
    },
  };
}

export async function storeEmailForSignIn(email: string): Promise<void> {
  await AsyncStorage.setItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY, email.trim().toLowerCase());
}

export async function readEmailForSignIn(): Promise<string | null> {
  const value = await AsyncStorage.getItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY);
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

export async function clearEmailForSignIn(): Promise<void> {
  await AsyncStorage.removeItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY);
}

export async function storePendingRegistration(
  registration: PendingRegistration,
): Promise<void> {
  await AsyncStorage.setItem(
    PENDING_REGISTRATION_STORAGE_KEY,
    JSON.stringify({
      firstName: registration.firstName.trim(),
      lastName: registration.lastName.trim(),
      email: registration.email.trim().toLowerCase(),
    } satisfies PendingRegistration),
  );
}

export async function readPendingRegistration(): Promise<PendingRegistration | null> {
  const raw = await AsyncStorage.getItem(PENDING_REGISTRATION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const firstName = typeof record.firstName === 'string' ? record.firstName.trim() : '';
    const lastName = typeof record.lastName === 'string' ? record.lastName.trim() : '';
    const email = typeof record.email === 'string' ? record.email.trim().toLowerCase() : '';

    if (!firstName || !lastName || !email) {
      return null;
    }

    return { firstName, lastName, email };
  } catch {
    return null;
  }
}

export async function clearPendingRegistration(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_REGISTRATION_STORAGE_KEY);
}

/** Sends a Firebase Magic Link to the given email address. */
export async function sendMagicLink(email: string): Promise<AuthActionResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, errorMessage: 'Ange en e-postadress.' };
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return {
      ok: false,
      errorMessage: 'Firebase är inte konfigurerat. Kontrollera .env-inställningarna.',
    };
  }

  try {
    await storeEmailForSignIn(trimmed);
    await sendSignInLinkToEmail(auth, trimmed, buildActionCodeSettings());
    return { ok: true };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte skicka inloggningslänk:', error);
    return { ok: false, errorMessage: getSwedishAuthErrorMessage(getAuthErrorCode(error)) };
  }
}

export function isAuthEmailLink(url: string): boolean {
  const auth = getFirebaseAuth();
  if (!auth || !url.trim()) {
    return false;
  }

  return isSignInWithEmailLink(auth, url);
}

/**
 * Completes Magic Link sign-in for the given email and link URL.
 * Creates the Firebase Auth user automatically on first use.
 */
export async function completeMagicLinkSignIn(
  email: string,
  linkUrl: string,
): Promise<AuthResult> {
  const trimmedEmail = email.trim().toLowerCase();
  const auth = getFirebaseAuth();

  if (!auth) {
    return {
      ok: false,
      errorMessage: 'Firebase är inte konfigurerat. Kontrollera .env-inställningarna.',
    };
  }

  if (!trimmedEmail) {
    return {
      ok: false,
      errorMessage: 'Ange samma e-postadress som du fick länken till.',
    };
  }

  if (!isSignInWithEmailLink(auth, linkUrl)) {
    return {
      ok: false,
      errorMessage: 'Inloggningslänken är ogiltig eller har gått ut. Be om en ny länk.',
    };
  }

  try {
    const credential = await signInWithEmailLink(auth, trimmedEmail, linkUrl);
    await clearEmailForSignIn();
    return { ok: true, user: credential.user };
  } catch (error) {
    console.error('[SeniorHub] Magic Link-inloggning misslyckades:', error);
    return { ok: false, errorMessage: getSwedishAuthErrorMessage(getAuthErrorCode(error)) };
  }
}
