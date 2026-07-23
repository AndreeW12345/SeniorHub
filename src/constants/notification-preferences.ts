/** Local reminder preference keys for the Notiser settings screen. */
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

export type NotificationPreferenceOption = {
  key: NotificationPreferenceKey;
  title: string;
  description: string;
};

export const NOTIFICATION_PREFERENCE_OPTIONS: NotificationPreferenceOption[] = [
  {
    key: 'dayBefore',
    title: 'Påminnelse dagen innan',
    description: 'Få en påminnelse dagen innan en bokad aktivitet.',
  },
  {
    key: 'oneHourBefore',
    title: 'Påminnelse 1 timme innan',
    description: 'Få en påminnelse en timme innan aktiviteten börjar.',
  },
  {
    key: 'activityUpdates',
    title: 'Aktivitetsuppdateringar',
    description: 'Få notiser om en aktivitet ändras eller ställs in.',
  },
];
