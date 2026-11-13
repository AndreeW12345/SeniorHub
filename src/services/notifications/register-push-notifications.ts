import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationPreferences } from '@/constants/notification-preferences';
import { fetchFcmRegistrationToken } from '@/firebase/messaging';
import {
  configureNotificationHandler,
  ensureAndroidNotificationChannel,
} from './configure-notifications';
import { saveUserPushToken } from './save-user-push-token';

export type RegisterPushNotificationsResult =
  | { ok: true; fcmToken: string | null; permissionGranted: boolean }
  | { ok: false; errorMessage: string };

/**
 * Asks for notification permission (first launch / when needed),
 * fetches FCM push token when possible, and stores it in Firestore.
 */
export async function registerPushNotifications(options?: {
  preferences?: NotificationPreferences;
  userId?: string | null;
}): Promise<RegisterPushNotificationsResult> {
  if (Platform.OS === 'web') {
    return { ok: true, fcmToken: null, permissionGranted: false };
  }

  try {
    configureNotificationHandler();
    await ensureAndroidNotificationChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== 'granted') {
      return { ok: true, fcmToken: null, permissionGranted: false };
    }

    const fcmToken = await fetchFcmRegistrationToken();

    if (fcmToken) {
      await saveUserPushToken({
        userId: options?.userId,
        fcmToken,
        preferences: options?.preferences,
      });
    }

    return { ok: true, fcmToken, permissionGranted: true };
  } catch (error) {
    console.error('[SeniorHub] Misslyckades med push-registrering:', error);
    return {
      ok: false,
      errorMessage: 'Kunde inte aktivera notiser just nu.',
    };
  }
}

/** Persists a refreshed native push token to Firestore. */
export async function persistRefreshedPushToken(params: {
  fcmToken: string;
  userId?: string | null;
  preferences?: NotificationPreferences;
}): Promise<void> {
  await saveUserPushToken({
    userId: params.userId,
    fcmToken: params.fcmToken,
    preferences: params.preferences,
  });
}
