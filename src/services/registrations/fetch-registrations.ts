import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import type { ActivityRegistration, RegistrationStatus } from '@/constants/registrations';
import { DEFAULT_REGISTRATION_STATUS } from '@/constants/registrations';
import { getFirebaseAuth } from '@/firebase';
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
 * Creates or reactivates a registration under activities/{activityId}/registrations/{auth.uid}.
 * Document ID is always the signed-in user's Firebase Auth UID.
 */
export async function createActivityRegistration(
  activityId: string,
  input: CreateRegistrationInput,
): Promise<RegistrationMutationResult> {
  const trimmedActivityId = activityId.trim();
  const name = input.name.trim();
  const phone = input.phone.trim();
  const status = input.status ?? DEFAULT_REGISTRATION_STATUS;

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

  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;
  const uid = currentUser?.uid?.trim();

  if (!uid) {
    return { ok: false, errorMessage: 'Du måste vara inloggad för att anmäla dig.' };
  }

  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firestore kunde inte initieras.' };
  }

  const registrationRef = doc(
    db,
    FIRESTORE_COLLECTIONS.activities,
    trimmedActivityId,
    FIRESTORE_COLLECTIONS.registrations,
    uid,
  );

  try {
    const existing = await getDoc(registrationRef);
    const payload = {
      name,
      phone,
      registeredAt: serverTimestamp(),
      status,
    };

    if (existing.exists()) {
      const existingStatus = existing.data()?.status;
      if (existingStatus !== 'cancelled') {
        return { ok: false, errorMessage: 'Du är redan anmäld till den här aktiviteten.' };
      }

      await updateDoc(registrationRef, payload);
      return { ok: true, id: uid };
    }

    await setDoc(registrationRef, payload);
    return { ok: true, id: uid };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte spara anmälan i Firestore.',
    };
  }
}
