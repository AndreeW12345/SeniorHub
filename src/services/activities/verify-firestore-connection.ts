import { collection, getDocs } from 'firebase/firestore';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';

export type FirestoreConnectionStatus = {
  configured: boolean;
  connected: boolean;
  documentCount: number;
  errorMessage?: string;
};

/** Tests read access to the activities collection in Firestore. */
export async function verifyFirestoreConnection(): Promise<FirestoreConnectionStatus> {
  if (!isFirebaseConfigured()) {
    return {
      configured: false,
      connected: false,
      documentCount: 0,
      errorMessage: 'Firebase-konfiguration saknas i .env',
    };
  }

  const db = getFirestoreDb();
  if (!db) {
    return {
      configured: true,
      connected: false,
      documentCount: 0,
      errorMessage: 'Firestore kunde inte initieras',
    };
  }

  try {
    const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.activities));

    return {
      configured: true,
      connected: true,
      documentCount: snapshot.size,
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      documentCount: 0,
      errorMessage: error instanceof Error ? error.message : 'Okänt fel vid Firestore-anslutning',
    };
  }
}
