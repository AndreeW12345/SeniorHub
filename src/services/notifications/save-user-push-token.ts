import { arrayUnion, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import type { NotificationPreferences } from '@/constants/notification-preferences';
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
  /** Stable device id (users/{deviceId}) or Auth uid (users/{uid}). */
  userDocId: string;
  fcmToken?: string | null;
  expoPushToken?: string | null;
  preferences?: NotificationPreferences;
};

async function writePushTokenDoc(params: SavePushTokenParams): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    return;
  }

  const trimmedId = params.userDocId.trim();
  if (!trimmedId) {
    return;
  }

  const payload: Record<string, unknown> = {
    platform: Platform.OS,
    updatedAt: serverTimestamp(),
  };

  if (params.fcmToken) {
    payload.fcmToken = params.fcmToken;
    payload.fcmTokens = arrayUnion(params.fcmToken);
  }

  if (params.expoPushToken) {
    payload.expoPushToken = params.expoPushToken;
  }

  if (params.preferences) {
    payload.notificationPreferences = params.preferences;
  }

  await setDoc(doc(db, FIRESTORE_COLLECTIONS.users, trimmedId), payload, { merge: true });
}

/** Saves FCM / Expo push tokens (and optional prefs) under users/{docId}. */
export async function saveUserPushToken(params: {
  deviceId: string;
  userId?: string | null;
  fcmToken?: string | null;
  expoPushToken?: string | null;
  preferences?: NotificationPreferences;
}): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  try {
    const tokenParams = {
      fcmToken: params.fcmToken,
      expoPushToken: params.expoPushToken,
      preferences: params.preferences,
    };

    await writePushTokenDoc({ userDocId: params.deviceId, ...tokenParams });

    const userId = params.userId?.trim();
    if (userId && userId !== params.deviceId) {
      await writePushTokenDoc({ userDocId: userId, ...tokenParams });
    }

    return { ok: true };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte spara push-token:', error);
    return { ok: false, errorMessage: 'Kunde inte spara push-token just nu.' };
  }
}

/** Syncs local notification preferences to Firestore for server-side push. */
export async function syncUserNotificationPreferences(params: {
  deviceId: string;
  userId?: string | null;
  preferences: NotificationPreferences;
}): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    return;
  }

  const payload = {
    notificationPreferences: params.preferences,
    platform: Platform.OS,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, FIRESTORE_COLLECTIONS.users, params.deviceId), payload, { merge: true });

    const userId = params.userId?.trim();
    if (userId && userId !== params.deviceId) {
      await setDoc(doc(db, FIRESTORE_COLLECTIONS.users, userId), payload, { merge: true });
    }
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte synka notisinställningar:', error);
  }
}
