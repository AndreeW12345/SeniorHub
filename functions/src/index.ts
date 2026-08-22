import { initializeApp } from 'firebase-admin/app';

import { scheduledActivityReminders } from './scheduled/activity-reminders';
import { configureMobileAuthLinks } from './setup/configure-mobile-auth-links';
import { onActivityUpdated } from './triggers/on-activity-updated';
import { onOrganizerApplicationCreated } from './triggers/on-organizer-application-created';
import { onRegistrationUpdated } from './triggers/on-registration-updated';
import { onRegistrationCreated } from './triggers/on-registration-created';

initializeApp();

export {
  configureMobileAuthLinks,
  onRegistrationCreated,
  onRegistrationUpdated,
  onOrganizerApplicationCreated,
  onActivityUpdated,
  scheduledActivityReminders,
};
