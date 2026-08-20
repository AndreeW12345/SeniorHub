export type NotificationPreferenceKey =
  | 'dayBefore'
  | 'oneHourBefore'
  | 'activityUpdates';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dayBefore: true,
  oneHourBefore: true,
  activityUpdates: true,
};

export type PushPreferenceKey =
  | NotificationPreferenceKey
  | 'organizerBookings';

export type NotificationType =
  | 'registration_confirmed'
  | 'cancellation'
  | 'waitlist_promoted'
  | 'activity_announcement'
  | 'activity_update'
  | 'organizer_booking'
  | 'activity_reminder_day_before'
  | 'activity_reminder_one_hour';

export type UserNotificationDocument = {
  icon: string;
  title: string;
  description: string;
  type: NotificationType;
  read: boolean;
  createdAt: FirebaseFirestore.FieldValue;
  activityId?: string;
};

export type PushPayload = {
  userId: string;
  title: string;
  body: string;
  preferenceKey: PushPreferenceKey;
  inbox: Omit<UserNotificationDocument, 'createdAt' | 'read'> & {
    stableId: string;
  };
  data?: Record<string, string>;
  /** When false, skip push but still write inbox if provided. */
  allowPush?: boolean;
  /** When false, skip inbox write entirely. */
  allowInbox?: boolean;
};

export type ImportantActivityChange = 'cancelled' | 'date' | 'time' | 'location';

export type ImportantActivityFields = {
  title: string;
  date: string;
  time: string;
  location: string;
  fullAddress?: string | null;
  isCancelled?: boolean | null;
};

export const COLLECTIONS = {
  activities: 'activities',
  users: 'users',
  admins: 'admins',
  registrations: 'registrations',
  userNotifications: 'notifications',
  reminderDeliveries: 'reminderDeliveries',
  organizerApplications: 'organizerApplications',
} as const;

export type ReminderKind = 'day_before' | 'one_hour_before';
