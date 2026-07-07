import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

import { getFirebaseApp } from '@/firebase/config';

let authInstance: Auth | null = null;

/**
 * Returns a shared Firebase Auth instance for native (iOS/Android).
 *
 * Uses AsyncStorage-backed persistence so an admin stays logged in between app
 * launches. Returns null when Firebase is not configured.
 */
export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  if (!authInstance) {
    try {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch {
      // initializeAuth throws if it was already initialized (e.g. after a fast
      // refresh). Fall back to the existing instance in that case.
      authInstance = getAuth(app);
    }
  }

  return authInstance;
}
