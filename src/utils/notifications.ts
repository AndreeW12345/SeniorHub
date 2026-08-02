import type { AppNotification, CreateNotificationInput } from '@/constants/notifications';

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
  _activityTitle: string,
): CreateNotificationInput {
  return {
    icon: '🎉',
    title: 'Plats tillgänglig',
    description: 'Du har fått en plats på aktiviteten!',
    type: 'waitlist_promoted',
  };
}

export function createActivityAnnouncementNotification(input: {
  announcementId: string;
  title: string;
  message: string;
  createdAt: Date;
}): CreateNotificationInput {
  return {
    id: `announcement-${input.announcementId}`,
    icon: '📢',
    title: input.title.trim(),
    description: input.message.trim(),
    type: 'activity_announcement',
    createdAt: input.createdAt.toISOString(),
  };
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
