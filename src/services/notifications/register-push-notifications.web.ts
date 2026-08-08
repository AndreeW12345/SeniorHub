import type { RegisterPushNotificationsResult } from './register-push-notifications';

export type { RegisterPushNotificationsResult };

export async function registerPushNotifications(): Promise<RegisterPushNotificationsResult> {
  return { ok: true, fcmToken: null, expoPushToken: null, permissionGranted: false };
}

export async function persistRefreshedPushToken(): Promise<void> {
  // Web has no native push tokens.
}
