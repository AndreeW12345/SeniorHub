import { getFirestore } from 'firebase-admin/firestore';

import { COLLECTIONS } from '../notifications/types';

function readStatus(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Sets activities/{activityId}.participants to the number of registrations
 * with status "registered". Idempotent — safe to call after any registration write.
 */
export async function syncActivityParticipants(activityId: string): Promise<void> {
  const trimmedActivityId = activityId.trim();
  if (!trimmedActivityId) {
    return;
  }

  const db = getFirestore();
  const activityRef = db.collection(COLLECTIONS.activities).doc(trimmedActivityId);
  const registrationsRef = activityRef.collection(COLLECTIONS.registrations);

  const countSnapshot = await registrationsRef.where('status', '==', 'registered').count().get();
  const registeredCount = Math.max(0, countSnapshot.data().count);

  const activitySnapshot = await activityRef.get();
  if (!activitySnapshot.exists) {
    return;
  }

  const currentParticipants = activitySnapshot.data()?.participants;
  if (
    typeof currentParticipants === 'number' &&
    Number.isFinite(currentParticipants) &&
    Math.floor(currentParticipants) === registeredCount
  ) {
    return;
  }

  await activityRef.update({ participants: registeredCount });
}

export function readRegistrationStatus(data: FirebaseFirestore.DocumentData | undefined): string {
  return readStatus(data?.status) || 'registered';
}

export function registrationStatusChanged(
  before: FirebaseFirestore.DocumentData | undefined,
  after: FirebaseFirestore.DocumentData | undefined,
): boolean {
  return readRegistrationStatus(before) !== readRegistrationStatus(after);
}
