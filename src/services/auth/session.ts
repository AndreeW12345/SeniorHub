import {
  onAuthStateChanged,
  signOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { Platform } from 'react-native';

import { getFirebaseAuth } from '@/firebase';
import { fetchFcmRegistrationToken } from '@/firebase/messaging';
import { getAuthErrorCode, getSwedishAuthErrorMessage } from '@/services/auth/errors';
import type { AuthActionResult } from '@/services/auth/providers/types';
import {
  removeCurrentDevicePushToken,
  resumePushTokenWritesAfterLogout,
  suspendPushTokenWritesForUser,
  waitForPushTokenWritesIdle,
} from '@/services/notifications/save-user-push-token';

/**
 * Clears this device's FCM token from Firestore before Auth sign-out.
 * Failures are logged; sign-out still proceeds so the user is not stuck logged in.
 */
async function clearDevicePushTokenBeforeSignOut(uid: string): Promise<void> {
  suspendPushTokenWritesForUser(uid);

  try {
    await waitForPushTokenWritesIdle();

    if (Platform.OS === 'web') {
      return;
    }

    const fcmToken = await fetchFcmRegistrationToken();
    const result = await removeCurrentDevicePushToken({
      userDocId: uid,
      fcmToken,
    });

    if (!result.ok) {
      console.warn(
        '[SeniorHub] Utloggning: push-token kunde inte rensas:',
        result.errorMessage,
      );
    }
  } catch (error) {
    console.warn('[SeniorHub] Utloggning: oväntat fel vid rensning av push-token:', error);
  }
}

/** Signs the current Firebase Auth user out. */
export async function signOutCurrentUser(): Promise<AuthActionResult> {
  const auth = getFirebaseAuth();

  if (!auth) {
    return {
      ok: false,
      errorMessage: 'Firebase är inte konfigurerat. Kontrollera .env-inställningarna.',
    };
  }

  const uid = auth.currentUser?.uid ?? null;

  try {
    if (uid) {
      await clearDevicePushTokenBeforeSignOut(uid);
    }

    await signOut(auth);
    return { ok: true };
  } catch (error) {
    console.error('[SeniorHub] Utloggning misslyckades:', error);
    return {
      ok: false,
      errorMessage: getSwedishAuthErrorMessage(getAuthErrorCode(error)),
    };
  } finally {
    if (uid) {
      resumePushTokenWritesAfterLogout();
    }
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
