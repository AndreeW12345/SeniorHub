import { doc, updateDoc } from 'firebase/firestore';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { decrementActivityParticipants } from '@/services/activities/save-activity';
import type { RegistrationMutationResult } from '@/services/registrations/fetch-registrations';

export type CancelActivityRegistrationResult = RegistrationMutationResult;

/**
 * Cancels a registration by setting status to "cancelled".
 * Modular entry point – a waitlist promotion step can hook in after a seat is freed.
 */
export async function cancelActivityRegistration(
  activityId: string,
  registrationId: string,
  options?: {
    /** Reserved for future waitlist auto-promotion when a seat becomes available. */
    onSeatAvailable?: (activityId: string) => void | Promise<void>;
  },
): Promise<CancelActivityRegistrationResult> {
  const trimmedActivityId = activityId.trim();
  const trimmedRegistrationId = registrationId.trim();

  if (!trimmedActivityId || !trimmedRegistrationId) {
    return { ok: false, errorMessage: 'Anmälan kunde inte hittas.' };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firestore kunde inte initieras.' };
  }

  try {
    await updateDoc(
      doc(
        db,
        FIRESTORE_COLLECTIONS.activities,
        trimmedActivityId,
        FIRESTORE_COLLECTIONS.registrations,
        trimmedRegistrationId,
      ),
      { status: 'cancelled' },
    );

    const countResult = await decrementActivityParticipants(trimmedActivityId);
    if (!countResult.ok) {
      console.warn(
        '[SeniorHub] Avanmälan sparades men deltagarräknaren kunde inte uppdateras:',
        countResult.errorMessage,
      );
    }

    // Hook for later: automatically promote someone from the waitlist.
    await options?.onSeatAvailable?.(trimmedActivityId);

    return { ok: true, id: trimmedRegistrationId };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte avanmäla dig från aktiviteten.',
    };
  }
}
