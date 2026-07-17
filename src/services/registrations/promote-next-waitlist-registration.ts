import { doc, runTransaction } from 'firebase/firestore';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { fetchActivityRegistrations } from '@/services/registrations/fetch-registrations';

export type PromoteNextWaitlistResult =
  | { ok: true; promoted: true; registrationId: string }
  | { ok: true; promoted: false }
  | { ok: false; errorMessage: string };

/**
 * Promotes a single waitlist registration to "registered" if its status is still waitlist.
 * Safe under concurrent cancels – only one caller wins the status change.
 */
async function tryPromoteWaitlistRegistration(
  activityId: string,
  registrationId: string,
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) {
    return false;
  }

  const registrationRef = doc(
    db,
    FIRESTORE_COLLECTIONS.activities,
    activityId,
    FIRESTORE_COLLECTIONS.registrations,
    registrationId,
  );

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(registrationRef);
    if (!snapshot.exists()) {
      return false;
    }

    const status = snapshot.data()?.status;
    if (status !== 'waitlist') {
      return false;
    }

    transaction.update(registrationRef, { status: 'registered' });
    return true;
  });
}

/**
 * Moves the oldest waitlist entry (FIFO by registeredAt) to status "registered".
 * Keeps name, phone and registeredAt unchanged. Promotes at most one person.
 */
export async function promoteNextWaitlistRegistration(
  activityId: string,
): Promise<PromoteNextWaitlistResult> {
  const trimmedActivityId = activityId.trim();

  if (!trimmedActivityId) {
    return { ok: false, errorMessage: 'Aktiviteten kunde inte hittas.' };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  try {
    const waitlist = await fetchActivityRegistrations(trimmedActivityId, {
      includeStatuses: ['waitlist'],
    });

    // FIFO: person who joined the waitlist first moves up first.
    const ordered = [...waitlist].sort(
      (a, b) => a.registeredAt.getTime() - b.registeredAt.getTime(),
    );

    for (const candidate of ordered) {
      const promoted = await tryPromoteWaitlistRegistration(trimmedActivityId, candidate.id);
      if (promoted) {
        return { ok: true, promoted: true, registrationId: candidate.id };
      }
    }

    return { ok: true, promoted: false };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Kunde inte flytta någon från reservlistan.',
    };
  }
}
