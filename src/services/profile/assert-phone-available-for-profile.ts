import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';

import { prepareCallableRequest } from '@/firebase/prepare-callable-request';

export const PHONE_ALREADY_IN_USE = 'PHONE_ALREADY_IN_USE';

type AssertPhoneAvailableRequest = {
  phoneNormalized: string;
};

type AssertPhoneAvailableResponse = {
  ok: true;
};

export type AssertPhoneAvailableForProfileResult =
  | { ok: true }
  | { ok: false; errorMessage: string; phoneAlreadyInUse: boolean };

function isPhoneAlreadyInUseError(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error && error.message.trim() === PHONE_ALREADY_IN_USE;
  }

  const message = error.message?.trim() ?? '';
  return (
    message === PHONE_ALREADY_IN_USE ||
    (error.code === 'functions/failed-precondition' && message.includes(PHONE_ALREADY_IN_USE))
  );
}

/** Confirms the normalized phone can be linked to the current user without reading phoneIndex from the client. */
export async function assertPhoneAvailableForProfile(
  phoneNormalized: string,
): Promise<AssertPhoneAvailableForProfileResult> {
  const trimmed = phoneNormalized.trim();
  if (!trimmed) {
    return { ok: false, errorMessage: 'Ange ett giltigt svenskt telefonnummer.', phoneAlreadyInUse: false };
  }

  const prepared = await prepareCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage, phoneAlreadyInUse: false };
  }

  try {
    const callable = httpsCallable<AssertPhoneAvailableRequest, AssertPhoneAvailableResponse>(
      prepared.functions,
      'assertPhoneAvailableForProfile',
    );
    await callable({ phoneNormalized: trimmed });
    return { ok: true };
  } catch (error) {
    if (isPhoneAlreadyInUseError(error)) {
      return {
        ok: false,
        errorMessage: 'Telefonnumret används redan av ett konto.',
        phoneAlreadyInUse: true,
      };
    }

    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message.trim()
        : 'Kunde inte verifiera telefonnumret just nu.';

    return { ok: false, errorMessage: message, phoneAlreadyInUse: false };
  }
}
