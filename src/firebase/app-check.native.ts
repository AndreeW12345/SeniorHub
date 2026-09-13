import { getApp as getNativeFirebaseApp } from '@react-native-firebase/app';
import {
  getToken as getNativeAppCheckToken,
  initializeAppCheck as initializeNativeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check';
import {
  CustomProvider,
  getToken as getJsAppCheckToken,
  initializeAppCheck,
  type AppCheck,
} from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';

import {
  buildNativeAppCheckProviderConfig,
  readNativeAppCheckDebugToken,
} from '@/firebase/app-check-config';
import {
  configureNativeAppCheckDebugTokenGlobal,
  isNativeAppCheckDevelopmentRuntime,
} from '@/firebase/app-check-runtime';

let appCheckInstance: AppCheck | null = null;
let appCheckInitPromise: Promise<AppCheck | null> | null = null;

/**
 * Initializes native App Check attestation and bridges tokens into the Firebase JS SDK.
 *
 * React Native Firebase performs Device Check / App Attest / Play Integrity attestation.
 * The JS SDK receives tokens through a CustomProvider so existing Firestore/Functions
 * clients continue to send App Check headers.
 */
export function initializeFirebaseAppCheck(app: FirebaseApp): Promise<AppCheck | null> {
  if (appCheckInstance) {
    return Promise.resolve(appCheckInstance);
  }

  if (!appCheckInitPromise) {
    appCheckInitPromise = initializeNativeFirebaseAppCheck(app)
      .then((instance) => {
        appCheckInstance = instance;
        return instance;
      })
      .catch((error) => {
        appCheckInitPromise = null;
        throw error;
      });
  }

  return appCheckInitPromise;
}

/** Verifies that App Check can return a token before protected requests run. */
export async function verifyFirebaseAppCheckToken(): Promise<void> {
  if (!appCheckInstance) {
    throw new Error('App Check är inte initierat.');
  }

  await getJsAppCheckToken(appCheckInstance, false);
}

async function initializeNativeFirebaseAppCheck(app: FirebaseApp): Promise<AppCheck | null> {
  configureNativeAppCheckDebugTokenGlobal();

  const rnfbProvider = new ReactNativeFirebaseAppCheckProvider();
  rnfbProvider.configure(
    buildNativeAppCheckProviderConfig({
      useDebugProvider: isNativeAppCheckDevelopmentRuntime(),
      debugToken: readNativeAppCheckDebugToken(),
    }),
  );

  const nativeAppCheck = initializeNativeAppCheck(getNativeFirebaseApp(), {
    provider: rnfbProvider,
    isTokenAutoRefreshEnabled: true,
  });
  if (isNativeAppCheckDevelopmentRuntime()) {
    try {
      await getNativeAppCheckToken(nativeAppCheck, true);
      console.info(
        '[SeniorHub] App Check debug provider active. Register the debug token in Firebase Console if booking fails.',
      );
    } catch (error) {
      console.warn('[SeniorHub] App Check debug token could not be fetched yet:', error);
    }
  }

  return initializeAppCheck(app, {
    provider: new CustomProvider({
      getToken: async () => {
        const result = await getNativeAppCheckToken(nativeAppCheck, false);
        return {
          token: result.token,
          expireTimeMillis: Date.now() + 60 * 60 * 1000,
        };
      },
    }),
    isTokenAutoRefreshEnabled: true,
  });
}
