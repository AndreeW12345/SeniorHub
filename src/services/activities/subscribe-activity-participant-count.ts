import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';

function readParticipantCount(data: Record<string, unknown> | undefined): number {
  const value = data?.participants;

  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }

  return 0;
}

/**
 * Live subscription to an activity's booked participant count (`participants` field).
 * Public read on activities/{id} — rule-compatible for all users.
 */
export function subscribeActivityParticipantCount(
  activityId: string,
  onUpdate: (participants: number) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const trimmedActivityId = activityId.trim();

  if (!trimmedActivityId || !isFirebaseConfigured()) {
    onUpdate(0);
    return () => undefined;
  }

  const db = getFirestoreDb();
  if (!db) {
    onUpdate(0);
    return () => undefined;
  }

  return onSnapshot(
    doc(db, FIRESTORE_COLLECTIONS.activities, trimmedActivityId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(0);
        return;
      }

      onUpdate(readParticipantCount(snapshot.data()));
    },
    (error) => {
      console.warn('[SeniorHub] Kunde inte lyssna på deltagarantal:', error);
      onError?.(error);
    },
  );
}
