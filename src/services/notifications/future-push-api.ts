/**
 * Future server-side push via Expo Push API.
 *
 * Local notifications cover booking confirmations and reminders on-device.
 * When activityUpdates (or other server events) should notify users remotely:
 *
 * 1. Read `users/{deviceId}.expoPushToken` (+ `notificationPreferences`) from Firestore
 * 2. POST to https://exp.host/--/api/v2/push/send with messages like:
 *    { to: token, title, body, data: { activityId, type: 'activity_update' } }
 * 3. Only send when preferences.activityUpdates === true
 *
 * This module is intentionally a stub until a Cloud Function / backend exists.
 */

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
};

/** Placeholder for a future Expo Push API client (server-side). */
export async function sendExpoPushMessages(_messages: ExpoPushMessage[]): Promise<void> {
  throw new Error(
    'Server push är inte implementerat ännu. Använd lokala notiser eller Expo Push API från backend.',
  );
}

export const FUTURE_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
