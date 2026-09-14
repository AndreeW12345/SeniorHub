import {
  getToken as getAppCheckToken,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';

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
 * Initializes Firebase App Check for web using reCAPTCHA Enterprise.
 * Must match Firebase Console → App Check → Web app provider registration.
 */
export function initializeFirebaseAppCheck(app: FirebaseApp): AppCheck | null {
  if (appCheckInstance) {
    return appCheckInstance;
  }

  configureDevelopmentDebugToken();

  const siteKey = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_RECAPTCHA_SITE_KEY?.trim();
  if (!siteKey) {
    return null;
  }

  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  return appCheckInstance;
}

/** Verifies that App Check can return a token before protected requests run. */
export async function verifyFirebaseAppCheckToken(): Promise<void> {
  if (!appCheckInstance) {
    return;
  }

  await getAppCheckToken(appCheckInstance, false);
}
