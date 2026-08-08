/** Local in-app notification kinds for the first notifications version. */
export const NOTIFICATION_TYPES = [
  'registration_confirmed',
  'cancellation',
  'waitlist_promoted',
  'activity_announcement',
  'activity_update',
  'organizer_booking',
  'activity_reminder_day_before',
  'activity_reminder_one_hour',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type AppNotification = {
  id: string;
  icon: string;
  title: string;
  description: string;
  /** ISO timestamp when the notification was created. */
  createdAt: string;
  read: boolean;
  type: NotificationType;
};

export type CreateNotificationInput = {
  /** Optional stable id (e.g. announcement sync). Skips insert if already present. */
  id?: string;
  icon: string;
  title: string;
  description: string;
  type: NotificationType;
  /** Optional ISO timestamp; defaults to now. */
  createdAt?: string;
};
