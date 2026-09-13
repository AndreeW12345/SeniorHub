import { Platform } from 'react-native';

type FirebaseAppIdEnv = {
  EXPO_PUBLIC_FIREBASE_APP_ID?: string;
  EXPO_PUBLIC_FIREBASE_IOS_APP_ID?: string;
  EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID?: string;
};

/**
 * Resolves the Firebase app id for the current platform.
 * Native builds prefer platform-specific ids so App Check attestation matches the JS SDK app.
 */
export function resolveFirebaseAppIdForPlatform(
  platform: typeof Platform.OS,
  env: FirebaseAppIdEnv = {
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    EXPO_PUBLIC_FIREBASE_IOS_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID,
    EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID,
  },
): string {
  const fallbackAppId = env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() ?? '';

  if (platform === 'ios') {
    const iosAppId = env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID?.trim();
    if (iosAppId) {
      return iosAppId;
    }

    if (fallbackAppId.includes(':ios:')) {
      return fallbackAppId;
    }
  }

  if (platform === 'android') {
    const androidAppId = env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID?.trim();
    if (androidAppId) {
      return androidAppId;
    }

    if (fallbackAppId.includes(':android:')) {
      return fallbackAppId;
    }
  }

  return fallbackAppId;
}

/** Resolves the Firebase app id for the running Expo platform. */
export function resolveFirebaseAppId(): string {
  return resolveFirebaseAppIdForPlatform(Platform.OS);
}
