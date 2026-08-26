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

async function userProfileDocExists(userId: string): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) {
    return false;
  }

  const currentUser = getFirebaseAuth()?.currentUser ?? null;
  const firebaseUid = currentUser?.uid ?? null;
  console.log('[SeniorHub PUSH DEBUG]');
  console.log('userId passed:', userId);
  console.log('firebase currentUser uid:', firebaseUid);
  console.log('firebase currentUser exists:', currentUser !== null);
  console.log('uids match:', firebaseUid !== null && firebaseUid === userId);

  const userDocPath = `users/${userId}`;
  console.log(`[SeniorHub PUSH DEBUG] getDoc START ${userDocPath}`);
  try {
    const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.users, userId));
    console.log(`[SeniorHub PUSH DEBUG] getDoc OK ${userDocPath}, exists: ${snapshot.exists()}`);
    return snapshot.exists();
  } catch (error) {
    console.error(`[SeniorHub PUSH DEBUG] getDoc THREW ${userDocPath}:`, error);
    throw error;
  }
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

function logPushTokenUpdatePayload(payload: Record<string, unknown>, userDocPath: string): void {
  console.log(`[SeniorHub PUSH DEBUG] updateDoc START ${userDocPath}`);
  console.log('[SeniorHub PUSH DEBUG] updateDoc payload keys:', Object.keys(payload));
  for (const key of Object.keys(payload)) {
    const value = payload[key];
    console.log(
      `[SeniorHub PUSH DEBUG] payload field "${key}":`,
      value,
      `(undefined: ${value === undefined})`,
    );
  }
  console.log(
    '[SeniorHub PUSH DEBUG] payload undefined keys:',
    Object.keys(payload).filter((key) => payload[key] === undefined),
  );
  console.log('[SeniorHub PUSH DEBUG] updateDoc payload object:', payload);
}

function logPushTokenUpdateDenied(params: {
  userDocPath: string;
  existingData: Record<string, unknown>;
  payload: Record<string, unknown>;
  error: unknown;
}): void {
  const existingKeys = Object.keys(params.existingData);
  const disallowedExistingKeys = existingKeys.filter((key) => !USER_SELF_UPDATE_ALLOWED_KEYS.has(key));

  console.error(`[SeniorHub PUSH DEBUG] updateDoc DENIED ${params.userDocPath}`);
  console.error('[SeniorHub PUSH DEBUG] existing document keys:', existingKeys);
  console.error(
    '[SeniorHub PUSH DEBUG] existing keys outside userSelfUpdateAllowedKeys():',
    disallowedExistingKeys,
  );
  console.error('[SeniorHub PUSH DEBUG] privileged fields on document:', {
    role: params.existingData.role ?? '(missing)',
    organizerOrganizationId: params.existingData.organizerOrganizationId ?? '(missing)',
  });
  console.error('[SeniorHub PUSH DEBUG] payload keys sent:', Object.keys(params.payload));
  console.error(
    '[SeniorHub PUSH DEBUG] hint: rules allow update only when affectedKeys ⊆ userSelfUpdateAllowedKeys();',
    'unchanged document fields (e.g. migratedFromDeviceId) must not appear in the diff.',
  );
  console.error('[SeniorHub PUSH DEBUG] updateDoc THREW:', params.error);
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
  const firebaseUid = currentUser?.uid ?? null;
  console.log('[SeniorHub PUSH DEBUG]');
  console.log('userId passed:', trimmedId);
  console.log('firebase currentUser uid:', firebaseUid);
  console.log('firebase currentUser exists:', currentUser !== null);
  console.log('uids match:', firebaseUid !== null && firebaseUid === trimmedId);

  const userRef = doc(db, FIRESTORE_COLLECTIONS.users, trimmedId);
  const userDocPath = `users/${trimmedId}`;

  console.log(`[SeniorHub PUSH DEBUG] getDoc START ${userDocPath}`);
  let snapshot;
  try {
    snapshot = await getDoc(userRef);
    console.log(`[SeniorHub PUSH DEBUG] getDoc OK ${userDocPath}, exists: ${snapshot.exists()}`);
  } catch (error) {
    console.error(`[SeniorHub PUSH DEBUG] getDoc THREW ${userDocPath}:`, error);
    throw error;
  }

  if (!snapshot.exists()) {
    return false;
  }

  const existingData = snapshot.data() as Record<string, unknown>;
  const payload = buildPushTokenUpdatePayload(existingData, params);

  if (Object.keys(payload).length === 0) {
    console.log(`[SeniorHub PUSH DEBUG] updateDoc SKIP ${userDocPath} (push fields already up to date)`);
    return true;
  }

  logPushTokenUpdatePayload(payload, userDocPath);

  try {
    await updateDoc(userRef, payload);
    console.log(`[SeniorHub PUSH DEBUG] updateDoc OK ${userDocPath}`);
    return true;
  } catch (error) {
    logPushTokenUpdateDenied({ userDocPath, existingData, payload, error });
    throw error;
  }
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
      const profileExists = await userProfileDocExists(userId);
      if (!profileExists) {
        return;
      }

      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.users, userId), payload);
    } catch (error) {
      console.warn('[SeniorHub] Kunde inte synka notisinställningar:', error);
    }
  });
}
