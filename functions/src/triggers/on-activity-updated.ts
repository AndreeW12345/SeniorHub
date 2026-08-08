import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import {
  pickActivityUpdateChange,
  readImportantActivityFields,
} from '../notifications/activity-fields';
import { notifyRegisteredUsersAboutActivityChange } from '../notifications/deliver-events';
import { COLLECTIONS } from '../notifications/types';

export const onActivityUpdated = onDocumentUpdated(
  `${COLLECTIONS.activities}/{activityId}`,
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) {
      return;
    }

    const previous = readImportantActivityFields(before);
    const next = readImportantActivityFields(after);
    const change = pickActivityUpdateChange(previous, next);

    if (!change) {
      return;
    }

    const activityId = event.params.activityId;
    const activityTitle = next.title || previous.title || 'aktiviteten';

    await notifyRegisteredUsersAboutActivityChange({
      activityId,
      activityTitle,
      change,
    });
  },
);
