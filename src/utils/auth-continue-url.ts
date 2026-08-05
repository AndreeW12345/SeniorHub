import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * Continue URL embedded in Firebase email sign-in links.
 * Prefer EXPO_PUBLIC_AUTH_CONTINUE_URL in production (web origin or universal link).
 */
export function getEmailLinkContinueUrl(): string {
  const configured = process.env.EXPO_PUBLIC_AUTH_CONTINUE_URL?.trim();
  if (configured) {
    return configured;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/auth/complete`;
  }

  return Linking.createURL('/auth/complete');
}

export function getAppBundleId(): string {
  return 'com.andreew12345.seniorhub';
}
