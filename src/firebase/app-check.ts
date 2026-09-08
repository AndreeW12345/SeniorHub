import type { FirebaseApp } from 'firebase/app';
import type { AppCheck } from 'firebase/app-check';

/**
 * Platform implementations live in app-check.web.ts and app-check.native.ts.
 * Metro resolves the correct module per platform.
 */
export function initializeFirebaseAppCheck(
  _app: FirebaseApp,
): AppCheck | null | Promise<AppCheck | null> {
  throw new Error('Firebase App Check platform module was not resolved.');
}
