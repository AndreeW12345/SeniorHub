import { doc, updateDoc } from 'firebase/firestore';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { decrementActivityParticipants } from '@/services/activities/save-activity';
import type { RegistrationMutationResult } from '@/services/registrations/fetch-registrations';
import { promoteNextWaitlistRegistration } from '@/services/registrations/promote-next-waitlist-registration';

export type CancelActivityRegistrationResult = RegistrationMutationResult;

/**
 * Cancels a registration by setting status to "cancelled".
 * When a seat is freed and the waitlist is not empty, the oldest waitlist entry
 * (FIFO) is promoted to "registered" so net capacity stays the same.
 */
export async function cancelActivityRegistration(
  activityId: string,
  registrationId: string,
  options?: {
    /**
     * When true (default), frees a booked seat or promotes from the waitlist.
     * Set to false when leaving the waitlist (no seat was taken).
     */
    freeSeat?: boolean;
    /** Optional hook after a seat change (promotion or free seat). */
    onSeatAvailable?: (activityId: string) => void | Promise<void>;
  },
): Promise<CancelActivityRegistrationResult> {
  const trimmedActivityId = activityId.trim();
  const trimmedRegistrationId = registrationId.trim();
  const freeSeat = options?.freeSeat !== false;

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

    if (freeSeat) {
      const promotion = await promoteNextWaitlistRegistration(trimmedActivityId);

      if (!promotion.ok) {
        console.warn(
          '[SeniorHub] Uppflyttning från reservlistan misslyckades, frigör platsen:',
          promotion.errorMessage,
        );
        const countResult = await decrementActivityParticipants(trimmedActivityId);
        if (!countResult.ok) {
          console.warn(
            '[SeniorHub] Avanmälan sparades men deltagarräknaren kunde inte uppdateras:',
            countResult.errorMessage,
          );
        }
      } else if (!promotion.promoted) {
        const countResult = await decrementActivityParticipants(trimmedActivityId);
        if (!countResult.ok) {
          console.warn(
            '[SeniorHub] Avanmälan sparades men deltagarräknaren kunde inte uppdateras:',
            countResult.errorMessage,
          );
        }
      }

      await options?.onSeatAvailable?.(trimmedActivityId);
    }

    return { ok: true, id: trimmedRegistrationId };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte avanmäla dig från aktiviteten.',
    };
  }
}
