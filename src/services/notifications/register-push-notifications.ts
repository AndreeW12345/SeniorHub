import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationPreferences } from '@/constants/notification-preferences';
import {
  configureNotificationHandler,
  ensureAndroidNotificationChannel,
} from './configure-notifications';
import { getOrCreateDeviceId } from './get-or-create-device-id';
import { saveUserPushToken } from './save-user-push-token';

export type RegisterPushNotificationsResult =
  | { ok: true; expoPushToken: string | null; permissionGranted: boolean }
  | { ok: false; errorMessage: string };

function getEasProjectId(): string | null {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

/**
 * Asks for notification permission (first launch / when needed),
 * fetches an Expo push token when possible, and stores it in Firestore.
 */
export async function registerPushNotifications(options?: {
  preferences?: NotificationPreferences;
}): Promise<RegisterPushNotificationsResult> {
  if (Platform.OS === 'web') {
    return { ok: true, expoPushToken: null, permissionGranted: false };
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
      return { ok: true, expoPushToken: null, permissionGranted: false };
    }

    const projectId = getEasProjectId();
    if (!projectId) {
      console.warn('[SeniorHub] EAS projectId saknas – kan inte hämta Expo push token.');
      return { ok: true, expoPushToken: null, permissionGranted: true };
    }

    let expoPushToken: string | null = null;

    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      expoPushToken = tokenResponse.data;
    } catch (error) {
      // Expected in Expo Go on some platforms / simulators without push credentials.
      console.warn('[SeniorHub] Kunde inte hämta Expo push token:', error);
    }

    if (expoPushToken) {
      const deviceId = await getOrCreateDeviceId();
      await saveUserPushToken({
        deviceId,
        expoPushToken,
        preferences: options?.preferences,
      });
    }

    return { ok: true, expoPushToken, permissionGranted: true };
  } catch (error) {
    console.error('[SeniorHub] Misslyckades med push-registrering:', error);
    return {
      ok: false,
      errorMessage: 'Kunde inte aktivera notiser just nu.',
    };
  }
}
