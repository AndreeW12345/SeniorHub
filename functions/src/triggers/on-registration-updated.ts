import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { COLLECTIONS } from '../notifications/types';
import { promoteNextWaitlistRegistration } from './promote-next-waitlist-registration';
import {
  readRegistrationStatus,
  registrationStatusChanged,
  syncActivityParticipants,
} from './sync-activity-participants';

export const onRegistrationUpdated = onDocumentUpdated(
  `${COLLECTIONS.activities}/{activityId}/${COLLECTIONS.registrations}/{registrationId}`,
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) {
      return;
    }

    if (!registrationStatusChanged(before, after)) {
      return;
    }

    const beforeStatus = readRegistrationStatus(before);
    const afterStatus = readRegistrationStatus(after);

    if (beforeStatus === 'registered' && afterStatus === 'cancelled') {
      await promoteNextWaitlistRegistration(event.params.activityId);
    }

    await syncActivityParticipants(event.params.activityId);
  },
);
