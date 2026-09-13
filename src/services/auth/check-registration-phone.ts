import { httpsCallable } from 'firebase/functions';

import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { preparePublicCallableRequest } from '@/firebase/prepare-public-callable-request';

type CheckRegistrationPhoneRequest = {
  phone: string;
};

type CheckRegistrationPhoneResponse = {
  available: boolean;
};

export type CheckRegistrationPhoneAvailableResult =
  | { ok: true; available: boolean }
  | { ok: false; errorMessage: string };

/** Server-side registration pre-check for unique phone numbers. */
export async function checkRegistrationPhoneAvailable(
  phone: string,
): Promise<CheckRegistrationPhoneAvailableResult> {
  const prepared = await preparePublicCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<
      CheckRegistrationPhoneRequest,
      CheckRegistrationPhoneResponse
    >(prepared.functions, 'checkRegistrationPhone');
    const response = await callable({ phone: phone.trim() });
    return { ok: true, available: response.data.available === true };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
