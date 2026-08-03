import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import type { ActiveRecurrenceFrequency } from '@/constants/recurrence';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import {
  buildActivityDocumentData,
  getFirestoreUnavailableResult,
  type ActivityFormInput,
  type ActivityMutationResult,
} from '@/services/activities/activity-form-data';
import { fetchActivitiesBySeriesIdFromFirestore } from '@/services/activities/fetch-activities';
import {
  buildRecurrenceRule,
  createSeriesId,
  generateOccurrenceDates,
} from '@/utils/recurrence';

export type SaveActivityOptions = {
  /** Stamped on create so the activity belongs to the admin's organization. */
  organizationId?: string | null;
  /**
   * When set, creates a full series of materialized occurrences.
   * Omitted/null keeps one-off create behavior (backward compatible).
   */
  recurrence?: {
    frequency: ActiveRecurrenceFrequency;
    endDate?: string | null;
    maxOccurrences?: number | null;
  } | null;
};

export type UpdateActivityOptions = {
  /** Defaults to updating only the opened occurrence. */
  scope?: 'occurrence' | 'series';
  seriesId?: string | null;
};

export type DeleteActivityOptions = {
  scope?: 'occurrence' | 'series';
  seriesId?: string | null;
};

/** Saves a new activity document (or a full recurring series) to Firestore. */
export async function saveActivityToFirestore(
  input: ActivityFormInput,
  options?: SaveActivityOptions,
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

  const organizationId = options?.organizationId?.trim();
  const recurrenceInput = options?.recurrence;

  if (!recurrenceInput) {
    try {
      const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.activities), {
        ...parsed.data,
        ...(organizationId ? { organizationId } : {}),
        createdAt: serverTimestamp(),
      });
      return { ok: true, id: docRef.id };
    } catch (error) {
      return {
        ok: false,
        errorMessage:
          error instanceof Error ? error.message : 'Kunde inte spara aktiviteten i Firestore.',
      };
    }
  }

  const rule = buildRecurrenceRule({
    frequency: recurrenceInput.frequency,
    startDate: parsed.data.date,
    endDate: recurrenceInput.endDate,
    maxOccurrences: recurrenceInput.maxOccurrences,
  });

  if (rule.endDate && rule.endDate < rule.startDate) {
    return {
      ok: false,
      errorMessage: 'Slutdatum måste vara samma dag som startdatum eller senare.',
    };
  }

  const occurrenceDates = generateOccurrenceDates(rule);
  if (occurrenceDates.length === 0) {
    return {
      ok: false,
      errorMessage: 'Kunde inte skapa tillfällen utifrån återkommande-regeln.',
    };
  }

  const seriesId = createSeriesId();

  try {
    const batch = writeBatch(db);
    let firstId = '';

    occurrenceDates.forEach((occurrenceDate, index) => {
      const docRef = doc(collection(db, FIRESTORE_COLLECTIONS.activities));
      if (index === 0) {
        firstId = docRef.id;
      }

      batch.set(docRef, {
        ...parsed.data,
        date: occurrenceDate,
        // Each occurrence has its own booking counter / registration subcollection.
        participants: parsed.data.participants,
        seriesId,
        occurrenceIndex: index,
        recurrence: rule,
        isRecurrenceException: false,
        ...(organizationId ? { organizationId } : {}),
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return { ok: true, id: firstId };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Kunde inte spara den återkommande aktiviteten i Firestore.',
    };
  }
}

/** Updates an existing activity, or shared fields across a series. */
export async function updateActivityInFirestore(
  activityId: string,
  input: ActivityFormInput,
  options?: UpdateActivityOptions,
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

  const scope = options?.scope ?? 'occurrence';
  const seriesId = options?.seriesId?.trim();

  if (scope === 'series' && seriesId) {
    try {
      const seriesActivities = await fetchActivitiesBySeriesIdFromFirestore(seriesId);
      if (seriesActivities.length === 0) {
        return { ok: false, errorMessage: 'Serien kunde inte hittas.' };
      }

      const batch = writeBatch(db);

      for (const activity of seriesActivities) {
        // Keep independently edited exceptions untouched when updating the series.
        if (activity.isRecurrenceException === true && activity.id !== activityId) {
          continue;
        }

        const isOpenedOccurrence = activity.id === activityId;
        batch.update(doc(db, FIRESTORE_COLLECTIONS.activities, activity.id), {
          ...parsed.data,
          // Preserve each occurrence's own date / index / bookings.
          date: isOpenedOccurrence ? parsed.data.date : activity.date,
          participants:
            typeof activity.participants === 'number' ? activity.participants : parsed.data.participants,
          seriesId: activity.seriesId ?? seriesId,
          occurrenceIndex: activity.occurrenceIndex ?? null,
          recurrence: activity.recurrence ?? null,
          isRecurrenceException: isOpenedOccurrence ? false : activity.isRecurrenceException === true,
        });
      }

      await batch.commit();
      return { ok: true, id: activityId };
    } catch (error) {
      return {
        ok: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Kunde inte uppdatera den återkommande serien i Firestore.',
      };
    }
  }

  try {
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.activities, activityId), {
      ...parsed.data,
      ...(seriesId
        ? {
            isRecurrenceException: true,
            seriesId,
          }
        : {}),
    });
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

/** Decrements the booked participant count for an activity by 1 (not below 0). */
export async function decrementActivityParticipants(
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
      participants: increment(-1),
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

/** Deletes one activity, or every occurrence in its series. */
export async function deleteActivityFromFirestore(
  activityId: string,
  options?: DeleteActivityOptions,
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

  const scope = options?.scope ?? 'occurrence';
  const seriesId = options?.seriesId?.trim();

  if (scope === 'series' && seriesId) {
    try {
      const seriesActivities = await fetchActivitiesBySeriesIdFromFirestore(seriesId);
      if (seriesActivities.length === 0) {
        // Fall back to deleting the opened document if the series query is empty.
        await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.activities, activityId));
        return { ok: true, id: activityId };
      }

      const batch = writeBatch(db);
      for (const activity of seriesActivities) {
        batch.delete(doc(db, FIRESTORE_COLLECTIONS.activities, activity.id));
      }
      await batch.commit();
      return { ok: true, id: activityId };
    } catch (error) {
      return {
        ok: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Kunde inte ta bort den återkommande serien från Firestore.',
      };
    }
  }

  try {
    await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.activities, activityId));
    return { ok: true, id: activityId };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte ta bort aktiviteten från Firestore.',
    };
  }
}
