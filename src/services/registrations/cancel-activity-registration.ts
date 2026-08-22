import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import type { RegistrationMutationResult } from '@/services/registrations/fetch-registrations';

export type CancelActivityRegistrationResult = RegistrationMutationResult;

/**
 * Cancels a registration by setting status to "cancelled".
 * Participant count and waitlist promotion are handled server-side when status changes.
 * Set freeSeat to false when leaving the waitlist (no seat was taken).
 */
export async function cancelActivityRegistration(
  activityId: string,
  registrationId: string,
  options?: {
    /**
     * When true (default), marks a booked seat as freed (registered → cancelled).
     * Set to false when leaving the waitlist (waitlist → cancelled).
     */
    freeSeat?: boolean;
    /** Optional hook after cancellation (e.g. refresh UI). */
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
      { status: 'cancelled', cancelledAt: serverTimestamp() },
    );

    if (freeSeat) {
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
