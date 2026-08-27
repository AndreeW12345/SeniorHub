import { bookActivityRegistration } from '@/services/registrations/book-activity-registration';

export type SubmitWaitlistRegistrationInput = {
  name: string;
  phone: string;
};

export type SubmitWaitlistRegistrationResult =
  | {
      ok: true;
      registrationId: string;
      status: 'registered' | 'waitlist';
    }
  | { ok: false; errorMessage: string };

/**
 * Saves a waitlist registration via the atomic Cloud Function.
 * Capacity is resolved server-side; a free seat yields status "registered".
 */
export async function submitWaitlistRegistration(
  activityId: string,
  input: SubmitWaitlistRegistrationInput,
): Promise<SubmitWaitlistRegistrationResult> {
  const result = await bookActivityRegistration(activityId, input);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    registrationId: result.registrationId,
    status: result.status,
  };
}
