import { addDoc, collection, deleteDoc, doc, increment, updateDoc } from 'firebase/firestore';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import {
  buildActivityDocumentData,
  getFirestoreUnavailableResult,
  type ActivityFormInput,
  type ActivityMutationResult,
} from '@/services/activities/activity-form-data';

export type { ActivityFormInput, ActivityMutationResult as SaveActivityResult };

/** Saves a new activity document to Firestore. */
export async function saveActivityToFirestore(
  input: ActivityFormInput,
): Promise<ActivityMutationResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const db = getFirestoreDb();
  if (!db) {
    return getFirestoreUnavailableResult();
  }

  const parsed = buildActivityDocumentData(input);
  if (!parsed.ok) {
    return parsed;
  }

  try {
    const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.activities), parsed.data);
    return { ok: true, id: docRef.id };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte spara aktiviteten i Firestore.',
    };
  }
}

/** Updates an existing activity document in Firestore. */
export async function updateActivityInFirestore(
  activityId: string,
  input: ActivityFormInput,
): Promise<ActivityMutationResult> {
  if (!activityId.trim()) {
    return { ok: false, errorMessage: 'Aktiviteten kunde inte hittas.' };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const db = getFirestoreDb();
  if (!db) {
    return getFirestoreUnavailableResult();
  }

  const parsed = buildActivityDocumentData(input);
  if (!parsed.ok) {
    return parsed;
  }

  try {
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.activities, activityId), parsed.data);
    return { ok: true, id: activityId };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte uppdatera aktiviteten i Firestore.',
    };
  }
}

/** Increments the booked participant count for an activity by 1. */
export async function incrementActivityParticipants(
  activityId: string,
): Promise<ActivityMutationResult> {
  if (!activityId.trim()) {
    return { ok: false, errorMessage: 'Aktiviteten kunde inte hittas.' };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const db = getFirestoreDb();
  if (!db) {
    return getFirestoreUnavailableResult();
  }

  try {
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.activities, activityId), {
      participants: increment(1),
    });
    return { ok: true, id: activityId };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Kunde inte uppdatera antalet anmälda i Firestore.',
    };
  }
}

/** Deletes an activity document from Firestore. */
export async function deleteActivityFromFirestore(
  activityId: string,
): Promise<ActivityMutationResult> {
  if (!activityId.trim()) {
    return { ok: false, errorMessage: 'Aktiviteten kunde inte hittas.' };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const db = getFirestoreDb();
  if (!db) {
    return getFirestoreUnavailableResult();
  }

  try {
    console.log('[SeniorHub] Firestore deleteDoc startar:', activityId);
    await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.activities, activityId));
    console.log('[SeniorHub] Firestore deleteDoc lyckades:', activityId);
    return { ok: true, id: activityId };
  } catch (error) {
    console.error('[SeniorHub] Firestore deleteDoc misslyckades:', activityId, error);
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte ta bort aktiviteten från Firestore.',
    };
  }
}
