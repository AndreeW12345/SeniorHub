import { getAuth, type Auth } from 'firebase/auth';

import { getFirebaseApp } from '@/firebase/config';

let authInstance: Auth | null = null;

/**
 * Returns a shared Firebase Auth instance for the web.
 *
 * On the web, `getAuth` persists the session in the browser (IndexedDB /
 * localStorage) by default. Returns null when Firebase is not configured.
 */
export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  if (!authInstance) {
    authInstance = getAuth(app);
  }

  return authInstance;
}
