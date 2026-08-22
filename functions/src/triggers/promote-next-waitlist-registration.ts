import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { COLLECTIONS } from '../notifications/types';

function readRegisteredAtMillis(data: FirebaseFirestore.DocumentData | undefined): number {
  const value = data?.registeredAt;
  if (value && typeof value === 'object' && 'toDate' in value) {
    const date = (value as FirebaseFirestore.Timestamp).toDate();
    return date.getTime();
  }

  return 0;
}

/**
 * Promotes the oldest waitlist registration (FIFO by registeredAt) to "registered".
 * Uses Admin SDK so promotion works regardless of client Security Rules.
 * Safe under concurrent cancels — only one transaction wins per candidate.
 */
export async function promoteNextWaitlistRegistration(activityId: string): Promise<boolean> {
  const trimmedActivityId = activityId.trim();
  if (!trimmedActivityId) {
    return false;
  }

  const db = getFirestore();
  const registrationsRef = db
    .collection(COLLECTIONS.activities)
    .doc(trimmedActivityId)
    .collection(COLLECTIONS.registrations);

  const waitlistSnapshot = await registrationsRef.where('status', '==', 'waitlist').get();
  if (waitlistSnapshot.empty) {
    return false;
  }

  const ordered = [...waitlistSnapshot.docs].sort(
    (a, b) => readRegisteredAtMillis(a.data()) - readRegisteredAtMillis(b.data()),
  );

  for (const candidate of ordered) {
    const promoted = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(candidate.ref);
      if (!snapshot.exists) {
        return false;
      }

      const status = snapshot.data()?.status;
      if (status !== 'waitlist') {
        return false;
      }

      transaction.update(candidate.ref, {
        status: 'registered',
        promotedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });

    if (promoted) {
      return true;
    }
  }

  return false;
}
