import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { europeWest1CallableOptions } from '../config/callable-options';
import { readRegistrationPhone } from '../utils/input-validation';
import { normalizeSwedishPhone } from '../utils/normalize-swedish-phone';
import { assertRateLimit } from '../utils/rate-limit';
import { COLLECTIONS } from '../notifications/types';

type CheckRegistrationPhoneResponse = {
  available: boolean;
};

const CHECK_REGISTRATION_PHONE_COOLDOWN_MS = 3_000;
const PHONE_INDEX_COLLECTION = 'phoneIndex';

/**
 * Checks whether a normalized phone number is already linked to an account.
 * Callable without sign-in; App Check enforced when deployed.
 */
export const checkRegistrationPhone = onCall(
  europeWest1CallableOptions(),
  async (request): Promise<CheckRegistrationPhoneResponse> => {
    const phoneRaw = readRegistrationPhone(request.data?.phone);
    if (!phoneRaw) {
      throw new HttpsError('invalid-argument', 'Ange ett giltigt telefonnummer.');
    }

    const normalized = normalizeSwedishPhone(phoneRaw);
    if (!normalized) {
      throw new HttpsError('invalid-argument', 'Ange ett giltigt svenskt telefonnummer.');
    }

    await assertRateLimit({
      docPath: `security/checkRegistrationPhone/attempts/${normalized}`,
      cooldownMs: CHECK_REGISTRATION_PHONE_COOLDOWN_MS,
    });

    const db = getFirestore();
    const indexDoc = await db.collection(PHONE_INDEX_COLLECTION).doc(normalized).get();
    if (indexDoc.exists) {
      return { available: false };
    }

    const usersQuery = await db
      .collection(COLLECTIONS.users)
      .where('phoneNormalized', '==', normalized)
      .limit(1)
      .get();

    if (!usersQuery.empty) {
      return { available: false };
    }

    return { available: true };
  },
);
