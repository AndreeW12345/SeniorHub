import { getAuth } from 'firebase-admin/auth';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { europeWest1CallableOptions } from '../config/callable-options';
import { readEmail } from '../utils/input-validation';
import { assertRateLimit } from '../utils/rate-limit';

type CheckLoginEmailResponse = {
  exists: boolean;
};

const CHECK_LOGIN_EMAIL_COOLDOWN_MS = 3_000;

/**
 * Checks whether an email has a Firebase Auth account (login pre-check).
 * Callable without sign-in; App Check enforced when deployed.
 */
export const checkLoginEmail = onCall(
  europeWest1CallableOptions(),
  async (request): Promise<CheckLoginEmailResponse> => {
    const email = readEmail(request.data?.email);
    if (!email) {
      throw new HttpsError('invalid-argument', 'Ange en giltig e-postadress.');
    }

    await assertRateLimit({
      docPath: `security/checkLoginEmail/attempts/${email}`,
      cooldownMs: CHECK_LOGIN_EMAIL_COOLDOWN_MS,
    });

    try {
      await getAuth().getUserByEmail(email);
      return { exists: true };
    } catch (error) {
      const code =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string'
          ? (error as { code: string }).code
          : '';

      if (code === 'auth/user-not-found') {
        return { exists: false };
      }

      console.error('[checkLoginEmail] Failed to look up Auth user:', error);
      throw new HttpsError(
        'internal',
        'Kunde inte kontrollera e-postadressen just nu. Försök igen.',
      );
    }
  },
);
