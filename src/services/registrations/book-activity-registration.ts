import { httpsCallable } from 'firebase/functions';

import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { prepareCallableRequest } from '@/firebase/prepare-callable-request';
import type { RegistrationStatus } from '@/constants/registrations';

export type BookActivityRegistrationInput = {
  name: string;
  phone: string;
};

export type BookActivityRegistrationResult =
  | { ok: true; registrationId: string; status: Extract<RegistrationStatus, 'registered' | 'waitlist'> }
  | { ok: false; errorMessage: string };

type CallableRequest = {
  activityId: string;
  name: string;
  phone: string;
};

type CallableResponse = {
  registrationId: string;
  status: Extract<RegistrationStatus, 'registered' | 'waitlist'>;
};

/**
 * Atomically books or waitlists the signed-in user via Cloud Functions.
 * Capacity is resolved server-side to prevent race conditions.
 */
export async function bookActivityRegistration(
  activityId: string,
  input: BookActivityRegistrationInput,
): Promise<BookActivityRegistrationResult> {
  const trimmedActivityId = activityId.trim();
  const name = input.name.trim();
  const phone = input.phone.trim();

  if (!trimmedActivityId) {
    return { ok: false, errorMessage: 'Aktiviteten kunde inte hittas.' };
  }

  if (!name) {
    return { ok: false, errorMessage: 'Ange namn.' };
  }

  if (!phone) {
    return { ok: false, errorMessage: 'Ange telefonnummer.' };
  }

  const prepared = await prepareCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<CallableRequest, CallableResponse>(
      prepared.functions,
      'bookActivityRegistration',
    );

    const response = await callable({
      activityId: trimmedActivityId,
      name,
      phone,
    });

    const registrationId = response.data.registrationId?.trim();
    const status = response.data.status;

    if (!registrationId || (status !== 'registered' && status !== 'waitlist')) {
      return { ok: false, errorMessage: 'Kunde inte spara anmälan. Försök igen.' };
    }

    return { ok: true, registrationId, status };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
