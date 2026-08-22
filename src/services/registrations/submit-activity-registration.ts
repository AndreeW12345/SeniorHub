import { createActivityRegistration } from '@/services/registrations/fetch-registrations';
import { notifyOrganizerBookingInFirestore } from '@/services/notifications/notify-organizer-booking';

export type SubmitActivityRegistrationInput = {
  name: string;
  phone: string;
};

export type SubmitActivityRegistrationResult =
  | { ok: true; registrationId: string }
  | { ok: false; errorMessage: string };

/**
 * Saves a SeniorHub registration. Participant count is synced server-side
 * when the registration document is written.
 */
export async function submitActivityRegistration(
  activityId: string,
  input: SubmitActivityRegistrationInput,
): Promise<SubmitActivityRegistrationResult> {
  const createResult = await createActivityRegistration(activityId, {
    name: input.name,
    phone: input.phone,
    status: 'registered',
  });

  if (!createResult.ok) {
    return createResult;
  }

  void notifyOrganizerBookingInFirestore({
    activityId,
    registrationId: createResult.id,
    userName: input.name,
  });

  return { ok: true, registrationId: createResult.id };
}
