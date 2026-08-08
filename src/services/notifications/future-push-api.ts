/**
 * Server-side push is implemented via Firebase Cloud Functions + FCM.
 *
 * See `functions/src/notifications/send-fcm.ts` and related triggers:
 * - onRegistrationCreated → organizer booking push
 * - onActivityUpdated → activity update / cancellation push
 * - scheduledActivityReminders → 24h / 1h reminders
 *
 * Tokens are stored on `users/{uid}` or `users/{deviceId}` as `fcmToken` / `fcmTokens`.
 */

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
};

/** @deprecated Use Cloud Functions FCM delivery instead. */
export async function sendExpoPushMessages(_messages: ExpoPushMessage[]): Promise<void> {
  throw new Error(
    'Server push skickas via Firebase Cloud Functions (FCM). Deploya functions/ och använd fcmToken i Firestore.',
  );
}

export const FUTURE_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
