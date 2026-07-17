import { createActivityRegistration } from '@/services/registrations/fetch-registrations';
import { incrementActivityParticipants } from '@/services/activities/save-activity';

export type SubmitActivityRegistrationInput = {
  name: string;
  phone: string;
};

export type SubmitActivityRegistrationResult =
  | { ok: true; registrationId: string }
  | { ok: false; errorMessage: string };

/**
 * Saves a SeniorHub registration and updates the activity participant count.
 * Modular entry point for the user booking flow (duplicate checks / cancel can hook in later).
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

  const countResult = await incrementActivityParticipants(activityId);

  if (!countResult.ok) {
    // Registration document was created; surface a soft warning but treat booking as saved
    // so admin list stays in sync. Seat counter can be refreshed later.
    console.warn(
      '[SeniorHub] Anmälan sparades men deltagarräknaren kunde inte uppdateras:',
      countResult.errorMessage,
    );
  }

  return { ok: true, registrationId: createResult.id };
}
