import { httpsCallable } from 'firebase/functions';

import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { preparePublicCallableRequest } from '@/firebase/prepare-public-callable-request';

type CheckLoginEmailRequest = {
  email: string;
};

type CheckLoginEmailResponse = {
  exists: boolean;
};

export type CheckLoginEmailExistsResult =
  | { ok: true; exists: boolean }
  | { ok: false; errorMessage: string };

/** Server-side login pre-check (Admin SDK); works with email enumeration protection enabled. */
export async function checkLoginEmailExists(
  email: string,
): Promise<CheckLoginEmailExistsResult> {
  const prepared = await preparePublicCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<CheckLoginEmailRequest, CheckLoginEmailResponse>(
      prepared.functions,
      'checkLoginEmail',
    );
    const response = await callable({ email: email.trim().toLowerCase() });
    return { ok: true, exists: response.data.exists === true };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
