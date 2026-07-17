import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import type { ActivityRegistration, RegistrationStatus } from '@/constants/registrations';
import { DEFAULT_REGISTRATION_STATUS } from '@/constants/registrations';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { mapRegistrationDocument } from '@/services/registrations/map-registration-document';

export type RegistrationMutationResult =
  | { ok: true; id: string }
  | { ok: false; errorMessage: string };

export type CreateRegistrationInput = {
  name: string;
  phone: string;
  status?: RegistrationStatus;
};

function getRegistrationsCollection(activityId: string) {
  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  return collection(
    db,
    FIRESTORE_COLLECTIONS.activities,
    activityId,
    FIRESTORE_COLLECTIONS.registrations,
  );
}

/** Fetches registrations for an activity, newest first. Defaults to active registrations only. */
export async function fetchActivityRegistrations(
  activityId: string,
  options?: { includeStatuses?: RegistrationStatus[] },
): Promise<ActivityRegistration[]> {
  if (!activityId.trim() || !isFirebaseConfigured()) {
    return [];
  }

  const registrationsRef = getRegistrationsCollection(activityId.trim());
  if (!registrationsRef) {
    return [];
  }

  const includeStatuses = options?.includeStatuses ?? [DEFAULT_REGISTRATION_STATUS];

  try {
    const snapshot = await getDocs(query(registrationsRef, orderBy('registeredAt', 'desc')));

    return snapshot.docs
      .map((document) => mapRegistrationDocument(document.id, activityId, document.data()))
      .filter((registration): registration is ActivityRegistration => registration !== null)
      .filter((registration) => includeStatuses.includes(registration.status));
  } catch (error) {
    // Fallback without orderBy if the composite index is missing or registeredAt is inconsistent.
    console.warn('[SeniorHub] Kunde inte hämta anmälningar med sortering:', error);

    const snapshot = await getDocs(registrationsRef);
    return snapshot.docs
      .map((document) => mapRegistrationDocument(document.id, activityId, document.data()))
      .filter((registration): registration is ActivityRegistration => registration !== null)
      .filter((registration) => includeStatuses.includes(registration.status))
      .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());
  }
}

/**
 * Creates a registration document under an activity.
 * Ready for the next booking step (user self-registration from the app).
 */
export async function createActivityRegistration(
  activityId: string,
  input: CreateRegistrationInput,
): Promise<RegistrationMutationResult> {
  const trimmedActivityId = activityId.trim();
  const name = input.name.trim();
  const phone = input.phone.trim();

  if (!trimmedActivityId) {
    return { ok: false, errorMessage: 'Aktiviteten kunde inte hittas.' };
  }

  if (!name) {
    return { ok: false, errorMessage: 'Ange namn.' };
  }

  if (!phone) {
    return { ok: false, errorMessage: 'Ange telefonnummer.' };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const registrationsRef = getRegistrationsCollection(trimmedActivityId);
  if (!registrationsRef) {
    return { ok: false, errorMessage: 'Firestore kunde inte initieras.' };
  }

  try {
    const docRef = await addDoc(registrationsRef, {
      name,
      phone,
      registeredAt: serverTimestamp(),
      status: input.status ?? DEFAULT_REGISTRATION_STATUS,
    });

    return { ok: true, id: docRef.id };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte spara anmälan i Firestore.',
    };
  }
}
