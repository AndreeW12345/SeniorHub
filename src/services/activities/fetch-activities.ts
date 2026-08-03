import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import type { Activity } from '@/constants/activities';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { mapActivityDocument } from '@/services/activities/map-activity-document';

/** Loads a single activity from Firestore by document id. */
export async function fetchActivityByIdFromFirestore(id: string): Promise<Activity | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.activities, id));

  if (!snapshot.exists()) {
    return null;
  }

  return mapActivityDocument(snapshot.id, snapshot.data());
}

/** Loads activities from Firestore. Returns an empty array when Firebase is unavailable. */
export async function fetchActivitiesFromFirestore(): Promise<Activity[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const db = getFirestoreDb();
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.activities));

  return snapshot.docs
    .map((document) => mapActivityDocument(document.id, document.data()))
    .filter((activity): activity is Activity => activity !== null);
}

/** Loads all materialized occurrences that share a series id. */
export async function fetchActivitiesBySeriesIdFromFirestore(
  seriesId: string,
): Promise<Activity[]> {
  const trimmed = seriesId.trim();
  if (!trimmed || !isFirebaseConfigured()) {
    return [];
  }

  const db = getFirestoreDb();
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.activities),
      where('seriesId', '==', trimmed),
    ),
  );

  return snapshot.docs
    .map((document) => mapActivityDocument(document.id, document.data()))
    .filter((activity): activity is Activity => activity !== null)
    .sort((a, b) => {
      const indexA = a.occurrenceIndex ?? Number.MAX_SAFE_INTEGER;
      const indexB = b.occurrenceIndex ?? Number.MAX_SAFE_INTEGER;
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      return a.date.localeCompare(b.date);
    });
}
