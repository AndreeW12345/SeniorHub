import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { notifyOrganizerAboutBooking } from '../notifications/deliver-events';
import { COLLECTIONS } from '../notifications/types';

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export const onRegistrationCreated = onDocumentCreated(
  `${COLLECTIONS.activities}/{activityId}/${COLLECTIONS.registrations}/{registrationId}`,
  async (event) => {
    const activityId = event.params.activityId;
    const registrationId = event.params.registrationId;
    const registration = event.data?.data();

    if (!registration) {
      return;
    }

    const status = readString(registration.status) ?? 'registered';
    if (status !== 'registered') {
      return;
    }

    const userName = readString(registration.name) ?? 'Någon';

    const activitySnap = await getFirestore()
      .collection(COLLECTIONS.activities)
      .doc(activityId)
      .get();
    const activity = activitySnap.data();

    if (!activity) {
      return;
    }

    const activityTitle = readString(activity.title) ?? 'aktiviteten';
    const organizationId = readString(activity.organizationId);

    if (!organizationId) {
      return;
    }

    await notifyOrganizerAboutBooking({
      activityId,
      registrationId,
      activityTitle,
      organizationId,
      userName,
    });
  },
);
