import { createActivityRegistration } from '@/services/registrations/fetch-registrations';

export type SubmitWaitlistRegistrationInput = {
  name: string;
  phone: string;
};

export type SubmitWaitlistRegistrationResult =
  | { ok: true; registrationId: string }
  | { ok: false; errorMessage: string };

/**
 * Saves a waitlist registration (status "waitlist") without taking a seat.
 * Ready for later auto-promotion into status "registered" when a seat frees up.
 */
export async function submitWaitlistRegistration(
  activityId: string,
  input: SubmitWaitlistRegistrationInput,
): Promise<SubmitWaitlistRegistrationResult> {
  const createResult = await createActivityRegistration(activityId, {
    name: input.name,
    phone: input.phone,
    status: 'waitlist',
  });

  if (!createResult.ok) {
    return createResult;
  }

  return { ok: true, registrationId: createResult.id };
}
