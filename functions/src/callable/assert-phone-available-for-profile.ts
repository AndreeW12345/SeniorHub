import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { europeWest1CallableOptions } from '../config/callable-options';
import { normalizeSwedishPhone } from '../utils/normalize-swedish-phone';

export const PHONE_ALREADY_IN_USE = 'PHONE_ALREADY_IN_USE';

type AssertPhoneAvailableRequest = {
  phone?: unknown;
  phoneNormalized?: unknown;
};

type AssertPhoneAvailableResponse = {
  ok: true;
};

function readPhoneNormalized(payload: AssertPhoneAvailableRequest): string | null {
  const direct =
    typeof payload.phoneNormalized === 'string' ? payload.phoneNormalized.trim() : '';
  if (direct) {
    return normalizeSwedishPhone(direct) ?? (direct.match(/^0\d{8,9}$/) ? direct : null);
  }

  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
  return phone ? normalizeSwedishPhone(phone) : null;
}

export type ReadPhoneIndexOwnerUid = (phoneNormalized: string) => Promise<string | null>;

async function readPhoneIndexOwnerUid(phoneNormalized: string): Promise<string | null> {
  const snapshot = await getFirestore().collection('phoneIndex').doc(phoneNormalized).get();
  if (!snapshot.exists) {
    return null;
  }

  const ownerUid = typeof snapshot.data()?.uid === 'string' ? snapshot.data()?.uid.trim() : '';
  return ownerUid || null;
}

/** Server-side phone index collision check (does not expose owner uid to the client). */
export async function assertPhoneIndexAvailableForUser(
  uid: string,
  phoneNormalized: string,
  readOwnerUid: ReadPhoneIndexOwnerUid = readPhoneIndexOwnerUid,
): Promise<void> {
  const ownerUid = await readOwnerUid(phoneNormalized);
  if (ownerUid && ownerUid !== uid) {
    throw new HttpsError('failed-precondition', PHONE_ALREADY_IN_USE);
  }
}

export const assertPhoneAvailableForProfile = onCall(
  europeWest1CallableOptions(),
  async (request): Promise<AssertPhoneAvailableResponse> => {
    const uid = request.auth?.uid?.trim();
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Du måste vara inloggad för att fortsätta.');
    }

    const phoneNormalized = readPhoneNormalized((request.data ?? {}) as AssertPhoneAvailableRequest);
    if (!phoneNormalized) {
      throw new HttpsError('invalid-argument', 'Ange ett giltigt svenskt telefonnummer.');
    }

    await assertPhoneIndexAvailableForUser(uid, phoneNormalized);
    return { ok: true };
  },
);
