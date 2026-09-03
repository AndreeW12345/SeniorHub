import { Platform } from 'react-native';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';

import { getFirebaseApp, isFirebaseConfigured } from '@/firebase/config';

let appCheckInstance: AppCheck | null = null;

/**
 * Initializes Firebase App Check when configured.
 *
 * Web: set EXPO_PUBLIC_FIREBASE_APP_CHECK_RECAPTCHA_SITE_KEY and register the site
 * in Firebase Console → App Check (reCAPTCHA v3).
 *
 * Native development: register a debug token in Firebase Console and set
 * EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN locally (never commit the token).
 *
 * Native production: enable DeviceCheck (iOS) / Play Integrity (Android) in
 * Firebase Console before enforcing App Check server-side.
 */
export function initializeFirebaseAppCheck(): AppCheck | null {
  if (appCheckInstance) {
    return appCheckInstance;
  }

  if (!isFirebaseConfigured()) {
    return null;
  }

  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  if (Platform.OS === 'web') {
    const siteKey = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_RECAPTCHA_SITE_KEY?.trim();
    if (!siteKey) {
      return null;
    }

    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    return appCheckInstance;
  }

  if (__DEV__) {
    const debugToken = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim();
    if (debugToken) {
      (globalThis as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }
  }

  return null;
}
