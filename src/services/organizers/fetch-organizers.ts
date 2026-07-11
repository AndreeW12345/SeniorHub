import { collection, getDocs } from 'firebase/firestore';

import type { Organizer } from '@/constants/organizers';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { mapOrganizerDocument } from '@/services/organizers/map-organizer-document';

/** Loads organizer profiles from Firestore. Returns an empty array when Firebase is unavailable. */
export async function fetchOrganizersFromFirestore(): Promise<Organizer[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const db = getFirestoreDb();
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.organizers));

  return snapshot.docs
    .map((document) => mapOrganizerDocument(document.id, document.data()))
    .filter((organizer): organizer is Organizer => organizer !== null);
}
