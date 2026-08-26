import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationPreferences } from '@/constants/notification-preferences';
import {
  configureNotificationHandler,
  ensureAndroidNotificationChannel,
} from './configure-notifications';
import { saveUserPushToken } from './save-user-push-token';

export type RegisterPushNotificationsResult =
  | { ok: true; fcmToken: string | null; expoPushToken: string | null; permissionGranted: boolean }
  | { ok: false; errorMessage: string };

function getEasProjectId(): string | null {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

async function fetchNativePushToken(): Promise<string | null> {
  try {
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    return tokenResponse.data?.trim() || null;
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte hämta FCM/APNs-token:', error);
    return null;
  }
}

async function fetchExpoPushToken(projectId: string): Promise<string | null> {
  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse.data?.trim() || null;
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte hämta Expo push token:', error);
    return null;
  }
}

/**
 * Asks for notification permission (first launch / when needed),
 * fetches FCM + Expo push tokens when possible, and stores them in Firestore.
 */
export async function registerPushNotifications(options?: {
  preferences?: NotificationPreferences;
  userId?: string | null;
}): Promise<RegisterPushNotificationsResult> {
  if (Platform.OS === 'web') {
    return { ok: true, fcmToken: null, expoPushToken: null, permissionGranted: false };
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
      return { ok: true, fcmToken: null, expoPushToken: null, permissionGranted: false };
    }

    const fcmToken = await fetchNativePushToken();

    let expoPushToken: string | null = null;
    const projectId = getEasProjectId();
    if (projectId) {
      expoPushToken = await fetchExpoPushToken(projectId);
    } else {
      console.warn('[SeniorHub] EAS projectId saknas – hoppar över Expo push token.');
    }

    if (fcmToken || expoPushToken) {
      await saveUserPushToken({
        userId: options?.userId,
        fcmToken,
        expoPushToken,
        preferences: options?.preferences,
      });
    }

    return { ok: true, fcmToken, expoPushToken, permissionGranted: true };
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
