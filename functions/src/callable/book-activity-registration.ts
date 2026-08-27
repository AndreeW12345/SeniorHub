import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { COLLECTIONS } from '../notifications/types';
import { readRegistrationStatus } from '../triggers/sync-activity-participants';

type RegistrationStatus = 'registered' | 'waitlist';

type BookActivityRegistrationRequest = {
  activityId?: unknown;
  name?: unknown;
  phone?: unknown;
};

type BookActivityRegistrationResponse = {
  registrationId: string;
  status: RegistrationStatus;
};

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readMaxParticipants(data: FirebaseFirestore.DocumentData): number | null {
  if (data.hasParticipantLimit !== true) {
    return null;
  }

  const maxParticipants = data.maxParticipants;
  if (
    typeof maxParticipants !== 'number' ||
    !Number.isFinite(maxParticipants) ||
    maxParticipants <= 0
  ) {
    return null;
  }

  return Math.floor(maxParticipants);
}

function resolveRegistrationStatus(
  activityData: FirebaseFirestore.DocumentData,
  registeredCount: number,
): RegistrationStatus {
  const maxParticipants = readMaxParticipants(activityData);
  if (maxParticipants === null) {
    return 'registered';
  }

  return registeredCount >= maxParticipants ? 'waitlist' : 'registered';
}

/**
 * Atomically books or waitlists the signed-in user on an activity.
 * Creates or reactivates activities/{activityId}/registrations/{uid}.
 * Updates activities.participants inside the same transaction when a seat is taken.
 */
export const bookActivityRegistration = onCall(
  { region: 'europe-west1' },
  async (request): Promise<BookActivityRegistrationResponse> => {
    const uid = request.auth?.uid?.trim();
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Du måste vara inloggad för att anmäla dig.');
    }

    const payload = (request.data ?? {}) as BookActivityRegistrationRequest;
    const activityId = readString(payload.activityId);
    const name = readString(payload.name);
    const phone = readString(payload.phone);

    if (!activityId) {
      throw new HttpsError('invalid-argument', 'Aktiviteten kunde inte hittas.');
    }

    if (!name) {
      throw new HttpsError('invalid-argument', 'Ange namn.');
    }

    if (!phone) {
      throw new HttpsError('invalid-argument', 'Ange telefonnummer.');
    }

    const db = getFirestore();
    const activityRef = db.collection(COLLECTIONS.activities).doc(activityId);
    const registrationRef = activityRef.collection(COLLECTIONS.registrations).doc(uid);

    return db.runTransaction(async (transaction) => {
      const activitySnapshot = await transaction.get(activityRef);
      if (!activitySnapshot.exists) {
        throw new HttpsError('not-found', 'Aktiviteten kunde inte hittas.');
      }

      const activityData = activitySnapshot.data() ?? {};
      if (activityData.isCancelled === true) {
        throw new HttpsError('failed-precondition', 'Aktiviteten är inställd.');
      }

      const registrationSnapshot = await transaction.get(registrationRef);
      if (registrationSnapshot.exists) {
        const existingStatus = readRegistrationStatus(registrationSnapshot.data());
        if (existingStatus !== 'cancelled') {
          throw new HttpsError(
            'failed-precondition',
            'Du är redan anmäld till den här aktiviteten.',
          );
        }
      }

      const registeredQuery = registrationRef.parent.where('status', '==', 'registered');
      const registeredSnapshot = await transaction.get(registeredQuery);
      const registeredCount = registeredSnapshot.size;

      const status = resolveRegistrationStatus(activityData, registeredCount);
      const registrationPayload = {
        name,
        phone,
        registeredAt: FieldValue.serverTimestamp(),
        status,
      };

      if (registrationSnapshot.exists) {
        transaction.update(registrationRef, registrationPayload);
      } else {
        transaction.set(registrationRef, registrationPayload);
      }

      if (status === 'registered') {
        transaction.update(activityRef, {
          participants: registeredCount + 1,
        });
      }

      return {
        registrationId: uid,
        status,
      };
    });
  },
);
