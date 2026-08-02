import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';

export type CreateActivityAnnouncementInput = {
  title: string;
  message: string;
  createdBy?: string;
};

export type CreateActivityAnnouncementResult =
  | { ok: true; id: string }
  | { ok: false; errorMessage: string };

/** Creates an activity announcement in Firestore for booked participants. */
export async function createActivityAnnouncement(
  activityId: string,
  input: CreateActivityAnnouncementInput,
): Promise<CreateActivityAnnouncementResult> {
  const trimmedActivityId = activityId.trim();
  const title = input.title.trim();
  const message = input.message.trim();

  if (!trimmedActivityId) {
    return { ok: false, errorMessage: 'Aktiviteten saknas.' };
  }

  if (!title) {
    return { ok: false, errorMessage: 'Ange en rubrik.' };
  }

  if (!message) {
    return { ok: false, errorMessage: 'Ange ett meddelande.' };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Kunde inte ansluta till databasen.' };
  }

  try {
    const announcementsRef = collection(
      db,
      FIRESTORE_COLLECTIONS.activities,
      trimmedActivityId,
      FIRESTORE_COLLECTIONS.announcements,
    );

    const payload: Record<string, unknown> = {
      title,
      message,
      createdAt: serverTimestamp(),
    };

    const createdBy = input.createdBy?.trim();
    if (createdBy) {
      payload.createdBy = createdBy;
    }

    const docRef = await addDoc(announcementsRef, payload);
    return { ok: true, id: docRef.id };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte skapa meddelande:', error);
    return {
      ok: false,
      errorMessage: 'Meddelandet kunde inte skickas. Försök igen.',
    };
  }
}
