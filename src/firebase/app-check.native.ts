import { getApp as getNativeFirebaseApp } from '@react-native-firebase/app';
import {
  getToken as getNativeAppCheckToken,
  initializeAppCheck as initializeNativeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check';
import {
  CustomProvider,
  initializeAppCheck,
  type AppCheck,
} from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';

import {
  buildNativeAppCheckProviderConfig,
  readNativeAppCheckDebugToken,
} from '@/firebase/app-check-config';

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

async function initializeNativeFirebaseAppCheck(app: FirebaseApp): Promise<AppCheck | null> {
  const rnfbProvider = new ReactNativeFirebaseAppCheckProvider();
  rnfbProvider.configure(
    buildNativeAppCheckProviderConfig({
      isDev: __DEV__,
      debugToken: readNativeAppCheckDebugToken(),
    }),
  );

  const nativeAppCheck = initializeNativeAppCheck(getNativeFirebaseApp(), {
    provider: rnfbProvider,
    isTokenAutoRefreshEnabled: true,
  });

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
