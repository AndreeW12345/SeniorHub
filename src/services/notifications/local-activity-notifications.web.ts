import type { Activity } from '@/constants/activities';
import type { NotificationPreferences } from '@/constants/notification-preferences';

/** Web no-op: local device notifications are not available. */
export async function sendLocalBookingConfirmation(_activityTitle: string): Promise<void> {}

/** Web no-op. */
export async function scheduleActivityReminders(
  _activity: Activity,
  _preferences: NotificationPreferences,
): Promise<void> {}

/** Web no-op. */
export async function cancelActivityReminders(_activityId: string): Promise<void> {}
