import type { NotificationPreferences } from '@/constants/notification-preferences';

export type RegisterPushNotificationsResult =
  | { ok: true; expoPushToken: string | null; permissionGranted: boolean }
  | { ok: false; errorMessage: string };

/** Web no-op: push registration is mobile-only. */
export async function registerPushNotifications(_options?: {
  preferences?: NotificationPreferences;
}): Promise<RegisterPushNotificationsResult> {
  return { ok: true, expoPushToken: null, permissionGranted: false };
}
