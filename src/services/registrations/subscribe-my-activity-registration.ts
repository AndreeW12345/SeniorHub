import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import {
  normalizeRegistrationStatus,
  type RegistrationStatus,
} from '@/constants/registrations';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';

/** Active registration status for the signed-in user, or null when not booked. */
export type MyActivityRegistrationStatus = RegistrationStatus | null;

function readMyRegistrationStatus(
  data: Record<string, unknown> | undefined,
): MyActivityRegistrationStatus {
  if (!data) {
    return null;
  }

  const status = normalizeRegistrationStatus(data.status);
  return status === 'cancelled' ? null : status;
}

/**
 * Live subscription to activities/{activityId}/registrations/{uid}.
 * Returns null when the document is missing or cancelled.
 */
export function subscribeMyActivityRegistration(
  activityId: string,
  uid: string,
  onUpdate: (status: MyActivityRegistrationStatus) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const trimmedActivityId = activityId.trim();
  const trimmedUid = uid.trim();

  if (!trimmedActivityId || !trimmedUid || !isFirebaseConfigured()) {
    onUpdate(null);
    return () => undefined;
  }

  const db = getFirestoreDb();
  if (!db) {
    onUpdate(null);
    return () => undefined;
  }

  return onSnapshot(
    doc(
      db,
      FIRESTORE_COLLECTIONS.activities,
      trimmedActivityId,
      FIRESTORE_COLLECTIONS.registrations,
      trimmedUid,
    ),
    (snapshot) => {
      onUpdate(readMyRegistrationStatus(snapshot.data()));
    },
    (error) => {
      console.warn('[SeniorHub] Kunde inte lyssna på egen anmälan:', error);
      onError?.(error);
      onUpdate(null);
    },
  );
}
