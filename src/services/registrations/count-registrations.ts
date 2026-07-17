import { collection, getCountFromServer, query, where } from 'firebase/firestore';

import type { RegistrationStatus } from '@/constants/registrations';
import { DEFAULT_REGISTRATION_STATUS } from '@/constants/registrations';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { fetchActivityRegistrations } from '@/services/registrations/fetch-registrations';

/**
 * Counts registrations for an activity by status.
 * Modular helper for seat availability (waitlist can count status "waitlist" later).
 */
export async function countActivityRegistrations(
  activityId: string,
  status: RegistrationStatus = DEFAULT_REGISTRATION_STATUS,
): Promise<number> {
  const trimmedActivityId = activityId.trim();

  if (!trimmedActivityId || !isFirebaseConfigured()) {
    return 0;
  }

  const db = getFirestoreDb();
  if (!db) {
    return 0;
  }

  const registrationsRef = collection(
    db,
    FIRESTORE_COLLECTIONS.activities,
    trimmedActivityId,
    FIRESTORE_COLLECTIONS.registrations,
  );

  try {
    const snapshot = await getCountFromServer(
      query(registrationsRef, where('status', '==', status)),
    );
    return snapshot.data().count;
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte räkna anmälningar via count-query:', error);
    const registrations = await fetchActivityRegistrations(trimmedActivityId, {
      includeStatuses: [status],
    });
    return registrations.length;
  }
}
