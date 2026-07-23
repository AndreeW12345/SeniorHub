import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Activity } from '@/constants/activities';
import type { NotificationPreferences } from '@/constants/notification-preferences';
import { ensureAndroidNotificationChannel } from './configure-notifications';
import {
  getActivityReminderNotificationId,
  getActivityReminderNotificationIds,
} from './notification-ids';
import { buildActivityCalendarEvent } from '@/utils/activity-calendar-event';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function canUseLocalNotifications(): boolean {
  return Platform.OS !== 'web';
}

async function scheduleAtDate(params: {
  identifier: string;
  title: string;
  body: string;
  date: Date;
  data: Record<string, string>;
}): Promise<string | null> {
  if (params.date.getTime() <= Date.now()) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    identifier: params.identifier,
    content: {
      title: params.title,
      body: params.body,
      data: params.data,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: params.date,
      ...(Platform.OS === 'android' ? { channelId: 'activity-reminders' } : null),
    },
  });
}

/** Immediate local confirmation after a successful booking. */
export async function sendLocalBookingConfirmation(activityTitle: string): Promise<void> {
  if (!canUseLocalNotifications()) {
    return;
  }

  try {
    await ensureAndroidNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Anmälan bekräftad',
        body: `Du är nu anmäld till ${activityTitle}.`,
        data: { type: 'registration_confirmed' },
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte visa bekräftelsenotis:', error);
  }
}

/**
 * Schedules day-before / one-hour-before reminders based on user preferences.
 * Replaces any previous reminders for the same activity.
 */
export async function scheduleActivityReminders(
  activity: Activity,
  preferences: NotificationPreferences,
): Promise<void> {
  if (!canUseLocalNotifications()) {
    return;
  }

  await cancelActivityReminders(activity.id);

  if (!preferences.dayBefore && !preferences.oneHourBefore) {
    return;
  }

  const event = buildActivityCalendarEvent(activity);
  if (!event) {
    console.warn('[SeniorHub] Kunde inte schemalägga påminnelser – ogiltigt datum/tid.');
    return;
  }

  try {
    await ensureAndroidNotificationChannel();

    const startDate = event.startDate;
    const title = activity.title.trim() || 'Aktivitet';

    if (preferences.dayBefore) {
      await scheduleAtDate({
        identifier: getActivityReminderNotificationId(activity.id, 'day-before'),
        title: 'Påminnelse: imorgon',
        body: `Imorgon: ${title}`,
        date: new Date(startDate.getTime() - DAY_MS),
        data: {
          type: 'reminder_day_before',
          activityId: activity.id,
        },
      });
    }

    if (preferences.oneHourBefore) {
      await scheduleAtDate({
        identifier: getActivityReminderNotificationId(activity.id, 'one-hour-before'),
        title: 'Påminnelse: snart dags',
        body: `Om en timme: ${title}`,
        date: new Date(startDate.getTime() - HOUR_MS),
        data: {
          type: 'reminder_one_hour_before',
          activityId: activity.id,
        },
      });
    }
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte schemalägga aktivitetspåminnelser:', error);
  }
}

/** Cancels all scheduled local reminders for an activity (e.g. on cancel). */
export async function cancelActivityReminders(activityId: string): Promise<void> {
  if (!canUseLocalNotifications()) {
    return;
  }

  try {
    await Promise.all(
      getActivityReminderNotificationIds(activityId).map((identifier) =>
        Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
      ),
    );
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte ta bort schemalagda påminnelser:', error);
  }
}
