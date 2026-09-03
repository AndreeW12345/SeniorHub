import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import type { NotificationPreferences } from '@/constants/notification-preferences';
import { getFirebaseAuth } from '@/firebase';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb } from '@/firebase/config';

export type UserPushTokenDocument = {
  /** Native FCM token (Android) or APNs token (iOS) for Firebase Admin push. */
  fcmToken?: string;
  fcmTokens?: string[];
  /** Legacy Expo push token – kept for compatibility. */
  expoPushToken?: string;
  platform: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
  notificationPreferences?: NotificationPreferences;
};

type SavePushTokenParams = {
  /** Firebase Auth uid (`users/{uid}`). */
  userDocId: string;
  fcmToken?: string | null;
  expoPushToken?: string | null;
  preferences?: NotificationPreferences;
};

/** Mirrors userSelfUpdateAllowedKeys() in firestore.rules — for diagnostics only. */
const USER_SELF_UPDATE_ALLOWED_KEYS = new Set([
  'name',
  'phone',
  'email',
  'photoUrl',
  'updatedAt',
  'platform',
  'fcmToken',
  'fcmTokens',
  'expoPushToken',
  'notificationPreferences',
]);

let pushTokenWriteChain: Promise<unknown> = Promise.resolve();

async function withPushTokenWriteLock<T>(operation: () => Promise<T>): Promise<T> {
  const run = pushTokenWriteChain.then(operation, operation);
  pushTokenWriteChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function readStoredTokenArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function notificationPreferencesEqual(
  next: NotificationPreferences,
  existing: unknown,
): boolean {
  if (!existing || typeof existing !== 'object') {
    return false;
  }

  const record = existing as Record<string, unknown>;
  return (
    record.dayBefore === next.dayBefore &&
    record.oneHourBefore === next.oneHourBefore &&
    record.activityUpdates === next.activityUpdates
  );
}

/**
 * Builds the smallest updateDoc payload allowed by users/{uid} owner update rules:
 * only push fields whose values actually differ from the existing document.
 */
function buildPushTokenUpdatePayload(
  existingData: Record<string, unknown>,
  params: SavePushTokenParams,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const platform = Platform.OS;

  if (existingData.platform !== platform) {
    payload.platform = platform;
  }

  const trimmedFcmToken = params.fcmToken?.trim();
  if (trimmedFcmToken) {
    if (existingData.fcmToken !== trimmedFcmToken) {
      payload.fcmToken = trimmedFcmToken;
    }

    const existingTokens = readStoredTokenArray(existingData.fcmTokens);
    if (!existingTokens.includes(trimmedFcmToken)) {
      payload.fcmTokens = [...existingTokens, trimmedFcmToken];
    }
  }

  const trimmedExpoToken = params.expoPushToken?.trim();
  if (trimmedExpoToken && existingData.expoPushToken !== trimmedExpoToken) {
    payload.expoPushToken = trimmedExpoToken;
  }

  if (
    params.preferences &&
    !notificationPreferencesEqual(params.preferences, existingData.notificationPreferences)
  ) {
    payload.notificationPreferences = params.preferences;
  }

  if (Object.keys(payload).length > 0) {
    payload.updatedAt = serverTimestamp();
  }

  return payload;
}

async function writePushTokenDoc(params: SavePushTokenParams): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) {
    return false;
  }

  const trimmedId = params.userDocId.trim();
  if (!trimmedId) {
    return false;
  }

  const currentUser = getFirebaseAuth()?.currentUser ?? null;
  if (!currentUser || currentUser.uid !== trimmedId) {
    return false;
  }

  const userRef = doc(db, FIRESTORE_COLLECTIONS.users, trimmedId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return false;
  }

  const existingData = snapshot.data() as Record<string, unknown>;
  const payload = buildPushTokenUpdatePayload(existingData, params);

  if (Object.keys(payload).length === 0) {
    return true;
  }

  const disallowedExistingKeys = Object.keys(existingData).filter(
    (key) => !USER_SELF_UPDATE_ALLOWED_KEYS.has(key),
  );
  if (disallowedExistingKeys.length > 0 && __DEV__) {
    console.warn(
      '[SeniorHub] User document contains fields outside self-update allowlist:',
      disallowedExistingKeys,
    );
  }

  await updateDoc(userRef, payload);
  return true;
}

/** Saves FCM / Expo push tokens (and optional prefs) under users/{auth.uid}. */
export async function saveUserPushToken(params: {
  userId?: string | null;
  fcmToken?: string | null;
  expoPushToken?: string | null;
  preferences?: NotificationPreferences;
}): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
  const userId = params.userId?.trim();
  if (!userId) {
    return { ok: true };
  }

  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  return withPushTokenWriteLock(async () => {
    try {
      await writePushTokenDoc({
        userDocId: userId,
        fcmToken: params.fcmToken,
        expoPushToken: params.expoPushToken,
        preferences: params.preferences,
      });

      return { ok: true };
    } catch (error) {
      console.error('[SeniorHub] Kunde inte spara push-token:', error);
      return { ok: false, errorMessage: 'Kunde inte spara push-token just nu.' };
    }
  });
}

/** Syncs local notification preferences to Firestore for server-side push. */
export async function syncUserNotificationPreferences(params: {
  userId?: string | null;
  preferences: NotificationPreferences;
}): Promise<void> {
  const userId = params.userId?.trim();
  if (!userId) {
    return;
  }

  const db = getFirestoreDb();
  if (!db) {
    return;
  }

  const payload = {
    notificationPreferences: params.preferences,
    platform: Platform.OS,
    updatedAt: serverTimestamp(),
  };

  await withPushTokenWriteLock(async () => {
    try {
      const userRef = doc(db, FIRESTORE_COLLECTIONS.users, userId);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) {
        return;
      }

      await updateDoc(userRef, payload);
    } catch (error) {
      console.warn('[SeniorHub] Kunde inte synka notisinställningar:', error);
    }
  });
}
