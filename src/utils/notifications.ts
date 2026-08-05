import type {
  AppNotification,
  CreateNotificationInput,
  NotificationType,
} from '@/constants/notifications';

export function createRegistrationConfirmedNotification(
  activityTitle: string,
): CreateNotificationInput {
  return {
    icon: '✅',
    title: 'Anmälan bekräftad',
    description: `Du är nu anmäld till "${activityTitle}".`,
    type: 'registration_confirmed',
  };
}

export function createCancellationNotification(activityTitle: string): CreateNotificationInput {
  return {
    icon: '❌',
    title: 'Avanmälan',
    description: `Du har avanmält dig från "${activityTitle}".`,
    type: 'cancellation',
  };
}

export function createWaitlistPromotedNotification(
  activityTitle: string,
): CreateNotificationInput {
  const title = activityTitle.trim() || 'aktiviteten';

  return {
    icon: '✅',
    title: 'Plats från väntelistan',
    description: `Du har fått en plats på '${title}' från väntelistan.`,
    type: 'waitlist_promoted',
  };
}

export function createActivityAnnouncementNotification(input: {
  announcementId: string;
  title: string;
  message: string;
  createdAt: Date;
  icon?: string;
  type?: Extract<NotificationType, 'activity_announcement' | 'activity_update'>;
}): CreateNotificationInput {
  return {
    id: `announcement-${input.announcementId}`,
    icon: input.icon?.trim() || '📢',
    title: input.title.trim(),
    description: input.message.trim(),
    type: input.type ?? 'activity_announcement',
    createdAt: input.createdAt.toISOString(),
  };
}

export function createActivityUpdateNotification(input: {
  announcementId: string;
  icon: string;
  title: string;
  message: string;
  createdAt: Date;
}): CreateNotificationInput {
  return createActivityAnnouncementNotification({
    announcementId: input.announcementId,
    icon: input.icon,
    title: input.title,
    message: input.message,
    createdAt: input.createdAt,
    type: 'activity_update',
  });
}

/** Newest notifications first. */
export function sortNotificationsNewestFirst(
  notifications: AppNotification[],
): AppNotification[] {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function formatNotificationTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const dateLabel = new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${dateLabel} kl. ${timeLabel}`;
}
