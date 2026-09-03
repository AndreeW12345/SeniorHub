import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { COLLECTIONS } from '../notifications/types';
import { europeWest1CallableOptions } from '../config/callable-options';
import { readRegistrationStatus } from '../triggers/sync-activity-participants';
import {
  readActivityId,
  readRegistrationName,
  readRegistrationPhone,
} from '../utils/input-validation';
import { assertRateLimit } from '../utils/rate-limit';

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


const BOOKING_COOLDOWN_MS = 2_000;

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
  europeWest1CallableOptions(),
  async (request): Promise<BookActivityRegistrationResponse> => {
    const uid = request.auth?.uid?.trim();
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Du måste vara inloggad för att anmäla dig.');
    }

    const payload = (request.data ?? {}) as BookActivityRegistrationRequest;
    const activityId = readActivityId(payload.activityId);
    const name = readRegistrationName(payload.name);
    const phone = readRegistrationPhone(payload.phone);

    if (!activityId) {
      throw new HttpsError('invalid-argument', 'Aktiviteten kunde inte hittas.');
    }

    if (!name) {
      throw new HttpsError('invalid-argument', 'Ange namn (max 100 tecken).');
    }

    if (!phone) {
      throw new HttpsError('invalid-argument', 'Ange telefonnummer (max 30 tecken).');
    }

    await assertRateLimit({
      docPath: `${COLLECTIONS.users}/${uid}/security/bookActivity`,
      cooldownMs: BOOKING_COOLDOWN_MS,
    });

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
