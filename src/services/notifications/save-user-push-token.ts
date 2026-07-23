import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import type { NotificationPreferences } from '@/constants/notification-preferences';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb } from '@/firebase/config';

export type UserPushTokenDocument = {
  expoPushToken: string;
  platform: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
  notificationPreferences?: NotificationPreferences;
};

/** Saves the Expo push token (and optional prefs) under users/{deviceId}. */
export async function saveUserPushToken(params: {
  deviceId: string;
  expoPushToken: string;
  preferences?: NotificationPreferences;
}): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  try {
    const payload: UserPushTokenDocument = {
      expoPushToken: params.expoPushToken,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    };

    if (params.preferences) {
      payload.notificationPreferences = params.preferences;
    }

    await setDoc(doc(db, FIRESTORE_COLLECTIONS.users, params.deviceId), payload, { merge: true });
    return { ok: true };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte spara push-token:', error);
    return { ok: false, errorMessage: 'Kunde inte spara push-token just nu.' };
  }
}

/** Syncs local notification preferences to Firestore for future server push. */
export async function syncUserNotificationPreferences(params: {
  deviceId: string;
  preferences: NotificationPreferences;
}): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    return;
  }

  try {
    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.users, params.deviceId),
      {
        notificationPreferences: params.preferences,
        platform: Platform.OS,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte synka notisinställningar:', error);
  }
}
