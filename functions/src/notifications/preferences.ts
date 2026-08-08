import type {
  NotificationPreferences,
  PushPreferenceKey,
} from './types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './types';

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeNotificationPreferences(
  value: unknown,
): NotificationPreferences {
  const record =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    dayBefore: readBoolean(record.dayBefore, DEFAULT_NOTIFICATION_PREFERENCES.dayBefore),
    oneHourBefore: readBoolean(
      record.oneHourBefore,
      DEFAULT_NOTIFICATION_PREFERENCES.oneHourBefore,
    ),
    activityUpdates: readBoolean(
      record.activityUpdates,
      DEFAULT_NOTIFICATION_PREFERENCES.activityUpdates,
    ),
  };
}

export function isPushEnabled(
  preferences: NotificationPreferences,
  key: PushPreferenceKey,
): boolean {
  switch (key) {
    case 'dayBefore':
      return preferences.dayBefore;
    case 'oneHourBefore':
      return preferences.oneHourBefore;
    case 'activityUpdates':
      return preferences.activityUpdates;
    case 'organizerBookings':
      // No client toggle yet – organizer booking alerts are always on for push.
      return true;
    default:
      return true;
  }
}
