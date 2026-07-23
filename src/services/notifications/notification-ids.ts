/** Deterministic local notification IDs for an activity booking. */
export type ActivityReminderKind = 'day-before' | 'one-hour-before';

export function getActivityReminderNotificationId(
  activityId: string,
  kind: ActivityReminderKind,
): string {
  return `seniorhub:activity:${activityId}:${kind}`;
}

export function getActivityReminderNotificationIds(activityId: string): string[] {
  return [
    getActivityReminderNotificationId(activityId, 'day-before'),
    getActivityReminderNotificationId(activityId, 'one-hour-before'),
  ];
}
