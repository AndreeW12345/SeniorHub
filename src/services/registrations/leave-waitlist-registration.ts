import { cancelActivityRegistration } from '@/services/registrations/cancel-activity-registration';
import type { CancelActivityRegistrationResult } from '@/services/registrations/cancel-activity-registration';

/**
 * Leaves the waitlist without freeing a seat (waitlist never took a seat).
 */
export async function leaveWaitlistRegistration(
  activityId: string,
  registrationId: string,
): Promise<CancelActivityRegistrationResult> {
  return cancelActivityRegistration(activityId, registrationId, { freeSeat: false });
}
