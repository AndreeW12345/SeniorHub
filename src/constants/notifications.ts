/** Local in-app notification kinds for the first notifications version. */
export const NOTIFICATION_TYPES = [
  'registration_confirmed',
  'cancellation',
  'waitlist_promoted',
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
  icon: string;
  title: string;
  description: string;
  type: NotificationType;
};
