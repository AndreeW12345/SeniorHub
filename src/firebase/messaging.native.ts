import {
  getMessaging,
  getToken,
  onTokenRefresh,
} from '@react-native-firebase/messaging';

/** Returns the FCM registration token used by Firebase Admin `messaging.send()`. */
export async function fetchFcmRegistrationToken(): Promise<string | null> {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    return token?.trim() || null;
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte hämta FCM-token:', error);
    return null;
  }
}

/** Persists token rotation from Firebase Cloud Messaging. */
export function subscribeFcmTokenRefresh(listener: (token: string) => void): () => void {
  const messaging = getMessaging();
  return onTokenRefresh(messaging, (token) => {
    const trimmed = token?.trim();
    if (trimmed) {
      listener(trimmed);
    }
  });
}
