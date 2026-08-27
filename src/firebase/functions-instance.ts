import { getFunctions, type Functions } from 'firebase/functions';

import { getFirebaseApp } from '@/firebase/config';

const FUNCTIONS_REGION = 'europe-west1';

let functionsInstance: Functions | null = null;

/** Shared Cloud Functions client for europe-west1 (matches deployed booking triggers). */
export function getFirebaseFunctions(): Functions | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  if (!functionsInstance) {
    functionsInstance = getFunctions(app, FUNCTIONS_REGION);
  }

  return functionsInstance;
}
