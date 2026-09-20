import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  deleteUser,
  getAdditionalUserInfo,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  type ActionCodeSettings,
} from 'firebase/auth';

import {
  EMAIL_FOR_SIGN_IN_STORAGE_KEY,
  PENDING_LOGIN_INTENT_STORAGE_KEY,
  PENDING_REGISTRATION_STORAGE_KEY,
  type PendingRegistration,
} from '@/constants/auth';
import {
  isValidPendingLegalConsent,
  type PendingLegalConsent,
} from '@/constants/legal-consent';
import { getFirebaseAuth } from '@/firebase';
import { requestLoginMagicLink } from '@/services/auth/check-login-email-exists';
import { getAuthErrorCode, getSwedishAuthErrorMessage } from '@/services/auth/errors';
import type { AuthActionResult, AuthProviderModule, AuthResult } from '@/services/auth/providers/types';
import {
  getAppBundleId,
  getEmailLinkContinueUrl,
  isMobileWebBrowser,
} from '@/utils/auth-continue-url';

export const emailLinkProvider: AuthProviderModule = {
  id: 'email_link',
  label: 'Inloggningslänk via e-post',
  isAvailable: true,
};

function buildActionCodeSettings(): ActionCodeSettings {
  const url = getEmailLinkContinueUrl();

  // Mobile web completes inside the browser SPA (/app/auth/complete) without native app links.
  if (Platform.OS === 'web' && isMobileWebBrowser()) {
    return {
      url,
      handleCodeInApp: true,
    };
  }

  const bundleId = getAppBundleId();

  // Firebase Hosting universal / app link flow (see Firebase Email Link Auth docs).
  // url must be HTTPS on an authorized Firebase Hosting domain; handleCodeInApp must be true.
  //
  // Do NOT set linkDomain for default Hosting domains (*.web.app / *.firebaseapp.com).
  // Firebase rejects those with auth/invalid-hosting-link-domain and auto-selects the
  // project Hosting domain when linkDomain is omitted.
  return {
    url,
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
  if (!isValidPendingLegalConsent(registration.legalConsent)) {
    throw new Error('Legal consent is required before registration can proceed.');
  }

  await AsyncStorage.setItem(
    PENDING_REGISTRATION_STORAGE_KEY,
    JSON.stringify({
      firstName: registration.firstName.trim(),
      lastName: registration.lastName.trim(),
      email: registration.email.trim().toLowerCase(),
      phone: registration.phone.trim(),
      legalConsent: {
        acceptedAt: registration.legalConsent.acceptedAt.trim(),
        version: registration.legalConsent.version.trim(),
      } satisfies PendingLegalConsent,
    } satisfies PendingRegistration),
  );
}

function parsePendingLegalConsent(record: Record<string, unknown>): PendingLegalConsent | null {
  const consentRecord = record.legalConsent;
  if (!consentRecord || typeof consentRecord !== 'object') {
    return null;
  }

  const consent = consentRecord as Record<string, unknown>;
  const acceptedAt = typeof consent.acceptedAt === 'string' ? consent.acceptedAt.trim() : '';
  const version = typeof consent.version === 'string' ? consent.version.trim() : '';

  const parsed: PendingLegalConsent = { acceptedAt, version };
  return isValidPendingLegalConsent(parsed) ? parsed : null;
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
    const phone = typeof record.phone === 'string' ? record.phone.trim() : '';
    const legalConsent = parsePendingLegalConsent(record);

    if (!firstName || !lastName || !email || !phone || !legalConsent) {
      return null;
    }

    return { firstName, lastName, email, phone, legalConsent };
  } catch {
    return null;
  }
}

export async function clearPendingRegistration(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_REGISTRATION_STORAGE_KEY);
}

export async function storePendingLoginIntent(): Promise<void> {
  await AsyncStorage.setItem(PENDING_LOGIN_INTENT_STORAGE_KEY, '1');
}

export async function readPendingLoginIntent(): Promise<boolean> {
  const value = await AsyncStorage.getItem(PENDING_LOGIN_INTENT_STORAGE_KEY);
  return value === '1';
}

export async function clearPendingLoginIntent(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_LOGIN_INTENT_STORAGE_KEY);
}

const LOGIN_ACCOUNT_NOT_FOUND_MESSAGE =
  'Det finns inget konto med den här e-postadressen. Skapa ett konto först.';

/**
 * Sends a Magic Link for login via the requestLoginMagicLink Cloud Function.
 * The server sends email only for existing accounts and always returns a neutral ok response.
 * signInWithEmailLink still auto-creates Auth users; completeMagicLinkSignIn rejects
 * login when Firebase reports a newly created user if the pre-check was bypassed.
 */
export async function sendLoginMagicLink(email: string): Promise<AuthActionResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, errorMessage: 'Ange en e-postadress.' };
  }

  const requestResult = await requestLoginMagicLink(trimmed, buildActionCodeSettings());
  if (!requestResult.ok) {
    return { ok: false, errorMessage: requestResult.errorMessage };
  }

  await clearPendingRegistration();
  await storePendingLoginIntent();
  await storeEmailForSignIn(trimmed);
  return { ok: true };
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

function readOobCodeFromLink(linkUrl: string): string | null {
  try {
    return new URL(linkUrl).searchParams.get('oobCode');
  } catch {
    return null;
  }
}

/** Prevents duplicate signInWithEmailLink calls when the same oobCode is handled twice. */
const inFlightMagicLinkSignIn = new Map<string, Promise<AuthResult>>();

/**
 * Completes Magic Link sign-in for the given email and link URL.
 * Creates the Firebase Auth user automatically on first use.
 */
export async function completeMagicLinkSignIn(
  email: string,
  linkUrl: string,
): Promise<AuthResult> {
  const oobCode = readOobCodeFromLink(linkUrl);
  if (oobCode) {
    const inFlight = inFlightMagicLinkSignIn.get(oobCode);
    if (inFlight) {
      return inFlight;
    }
  }

  const task = completeMagicLinkSignInOnce(email, linkUrl);
  if (oobCode) {
    inFlightMagicLinkSignIn.set(oobCode, task);
    try {
      return await task;
    } finally {
      inFlightMagicLinkSignIn.delete(oobCode);
    }
  }

  return task;
}

async function completeMagicLinkSignInOnce(
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
    const isLoginIntent = await readPendingLoginIntent();
    const isNewAuthUser = getAdditionalUserInfo(credential)?.isNewUser === true;

    if (isLoginIntent && isNewAuthUser) {
      await clearPendingLoginIntent();
      await clearEmailForSignIn();
      try {
        await deleteUser(credential.user);
      } catch (deleteError) {
        console.error('[SeniorHub] Kunde inte ta bort auto-skapad Auth-användare:', deleteError);
      }
      return { ok: false, errorMessage: LOGIN_ACCOUNT_NOT_FOUND_MESSAGE };
    }

    if (isLoginIntent) {
      await clearPendingLoginIntent();
    }

    await clearEmailForSignIn();
    return { ok: true, user: credential.user };
  } catch (error) {
    console.error('[SeniorHub] Magic Link-inloggning misslyckades:', error);
    return { ok: false, errorMessage: getSwedishAuthErrorMessage(getAuthErrorCode(error)) };
  }
}
