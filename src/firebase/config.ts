import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

import { initializeFirebaseAppCheck, verifyFirebaseAppCheckToken } from '@/firebase/app-check';
import { resolveFirebaseAppId } from '@/firebase/resolve-firebase-app-id';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: resolveFirebaseAppId(),
};

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let appCheckInitPromise: Promise<void> | null = null;
let appCheckInitError: unknown = null;

function startFirebaseAppCheckInit(app: FirebaseApp): void {
  if (appCheckInitPromise) {
    return;
  }

  const result = initializeFirebaseAppCheck(app);
  if (result instanceof Promise) {
    appCheckInitPromise = result
      .then(() => undefined)
      .catch((error) => {
        appCheckInitError = error;
        console.warn('[Firebase] App Check initialization failed', error);
        throw error;
      });
    return;
  }

  appCheckInitPromise = Promise.resolve();
}

/** Waits until native/web App Check has finished initializing (no-op when unconfigured). */
export async function ensureFirebaseAppCheckReady(): Promise<void> {
  const app = getFirebaseApp();
  if (!app) {
    return;
  }

  if (appCheckInitError) {
    throw appCheckInitError;
  }

  if (appCheckInitPromise) {
    await appCheckInitPromise;
  }

  if (appCheckInitError) {
    throw appCheckInitError;
  }

  if (Platform.OS === 'web') {
    return;
  }

  try {
    await verifyFirebaseAppCheckToken();
  } catch (error) {
    appCheckInitError = error;
    throw error;
  }
}

/** Returns true when all required Firebase env vars are present. */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

/** Initializes Firebase once and returns the app instance. */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    startFirebaseAppCheckInit(firebaseApp);
  }

  return firebaseApp;
}

/** Returns a shared Firestore instance, or null if Firebase is not configured. */
export function getFirestoreDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  if (!firestoreDb) {
    firestoreDb = getFirestore(app);
  }

  return firestoreDb;
}

/** Returns true when Firebase Storage is configured via storageBucket. */
export function isFirebaseStorageConfigured(): boolean {
  return isFirebaseConfigured() && Boolean(firebaseConfig.storageBucket);
}

/** Returns a shared Firebase Storage instance, or null if not configured. */
export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  if (!app || !firebaseConfig.storageBucket) {
    return null;
  }

  if (!firebaseStorage) {
    firebaseStorage = getStorage(app);
  }

  return firebaseStorage;
}
