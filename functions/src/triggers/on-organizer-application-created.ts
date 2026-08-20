import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { RESEND_API_KEY } from '../config/secrets';
import {
  ORGANIZER_APPLICATION_DEFAULT_STATUS,
  sendOrganizerApplicationEmails,
} from '../email/organizer-application-emails';
import { COLLECTIONS } from '../notifications/types';

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export const onOrganizerApplicationCreated = onDocumentCreated(
  {
    document: `${COLLECTIONS.organizerApplications}/{applicationId}`,
    region: 'europe-west1',
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const applicationId = event.params.applicationId;
    const application = event.data?.data();

    if (!application) {
      return;
    }

    const name = readString(application.name);
    const email = readString(application.email);
    const phone = readString(application.phone);
    const organization = readString(application.organization);
    const description = readString(application.description);
    const status = readString(application.status) ?? ORGANIZER_APPLICATION_DEFAULT_STATUS;

    if (!name || !email || !phone || !organization || !description) {
      console.error(
        '[SeniorHub] Arrangörsansökan saknar obligatoriska fält:',
        applicationId,
      );
      return;
    }

    await sendOrganizerApplicationEmails(RESEND_API_KEY.value(), {
      applicationId,
      name,
      email,
      phone,
      organization,
      description,
      status,
    });
  },
);
