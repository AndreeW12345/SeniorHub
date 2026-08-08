import { initializeApp } from 'firebase-admin/app';

import { scheduledActivityReminders } from './scheduled/activity-reminders';
import { onActivityUpdated } from './triggers/on-activity-updated';
import { onRegistrationCreated } from './triggers/on-registration-created';

initializeApp();

export { onRegistrationCreated, onActivityUpdated, scheduledActivityReminders };
