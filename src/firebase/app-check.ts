import { Platform } from 'react-native';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';

import { getFirebaseApp, isFirebaseConfigured } from '@/firebase/config';

let appCheckInstance: AppCheck | null = null;

/**
 * Registers a Firebase App Check debug token for local development only.
 * Never runs in production builds (__DEV__ is false).
 */
function configureDevelopmentDebugToken(): void {
  if (!__DEV__) {
    return;
  }

  const debugToken = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim();
  if (!debugToken) {
    return;
  }

  (globalThis as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
}

/**
 * Initializes Firebase App Check when configured.
 *
 * Web: set EXPO_PUBLIC_FIREBASE_APP_CHECK_RECAPTCHA_SITE_KEY and register the site
 * in Firebase Console → App Check (reCAPTCHA v3). Optional debug token in __DEV__.
 *
 * Native: the Firebase JS SDK does not ship DeviceCheck / Play Integrity providers.
 * Production native App Check requires @react-native-firebase/app-check plus native
 * setup (google-services files, config plugin, EAS dev client). Until that is added,
 * native builds do not send App Check tokens.
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
    configureDevelopmentDebugToken();

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

  // Native dev may pre-register a debug token for a future RNFB App Check setup.
  configureDevelopmentDebugToken();

  return null;
}
