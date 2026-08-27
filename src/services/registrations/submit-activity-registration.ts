import { bookActivityRegistration } from '@/services/registrations/book-activity-registration';

export type SubmitActivityRegistrationInput = {
  name: string;
  phone: string;
};

export type SubmitActivityRegistrationResult =
  | {
      ok: true;
      registrationId: string;
      status: 'registered' | 'waitlist';
    }
  | { ok: false; errorMessage: string };

/**
 * Saves a SeniorHub registration via the atomic Cloud Function.
 * Participant count and organizer notifications are handled server-side by triggers.
 */
export async function submitActivityRegistration(
  activityId: string,
  input: SubmitActivityRegistrationInput,
): Promise<SubmitActivityRegistrationResult> {
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
