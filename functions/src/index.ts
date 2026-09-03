import { initializeApp } from 'firebase-admin/app';

import { bookActivityRegistration } from './callable/book-activity-registration';
import { deleteUserAccount } from './callable/delete-user-account';
import { scheduledActivityReminders } from './scheduled/activity-reminders';
import { configureMobileAuthLinks } from './setup/configure-mobile-auth-links';
import { onActivityUpdated } from './triggers/on-activity-updated';
import { onOrganizerApplicationCreated } from './triggers/on-organizer-application-created';
import { onRegistrationUpdated } from './triggers/on-registration-updated';
import { onRegistrationCreated } from './triggers/on-registration-created';

initializeApp();

export {
  bookActivityRegistration,
  deleteUserAccount,
  configureMobileAuthLinks,
  onRegistrationCreated,
  onRegistrationUpdated,
  onOrganizerApplicationCreated,
  onActivityUpdated,
  scheduledActivityReminders,
};
