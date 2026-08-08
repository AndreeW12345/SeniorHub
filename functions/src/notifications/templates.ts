import type { ImportantActivityChange } from './types';

export function organizerBookingPush(userName: string, activityTitle: string) {
  const safeUser = userName.trim() || 'Någon';
  const safeTitle = activityTitle.trim() || 'din aktivitet';

  return {
    title: '🎉 Ny bokning!',
    body: `${safeUser} har bokat din aktivitet "${safeTitle}".`,
    icon: '🎉',
    description: `${safeUser} har bokat din aktivitet "${safeTitle}".`,
    type: 'organizer_booking' as const,
  };
}

export function activityUpdatedPush(activityTitle: string) {
  const safeTitle = activityTitle.trim() || 'aktiviteten';

  return {
    title: '📢 Aktiviteten har uppdaterats',
    body: `Aktiviteten "${safeTitle}" har ändrats. Kontrollera den nya informationen.`,
    icon: '📢',
    description: `Aktiviteten "${safeTitle}" har ändrats. Kontrollera den nya informationen.`,
    type: 'activity_update' as const,
  };
}

export function activityCancelledPush(activityTitle: string) {
  const safeTitle = activityTitle.trim() || 'aktiviteten';

  return {
    title: '❌ Aktiviteten är inställd',
    body: `Tyvärr har "${safeTitle}" blivit inställd av arrangören.`,
    icon: '❌',
    description: `Tyvärr har "${safeTitle}" blivit inställd av arrangören.`,
    type: 'activity_update' as const,
  };
}

export function reminderDayBeforePush(activityTitle: string) {
  const safeTitle = activityTitle.trim() || 'aktiviteten';

  return {
    title: '📅 Påminnelse',
    body: `Din aktivitet "${safeTitle}" börjar imorgon.`,
    icon: '📅',
    description: `Din aktivitet "${safeTitle}" börjar imorgon.`,
    type: 'activity_reminder_day_before' as const,
  };
}

export function reminderOneHourPush(activityTitle: string) {
  const safeTitle = activityTitle.trim() || 'aktiviteten';

  return {
    title: '⏰ Snart dags!',
    body: `Din aktivitet "${safeTitle}" börjar om ungefär en timme.`,
    icon: '⏰',
    description: `Din aktivitet "${safeTitle}" börjar om ungefär en timme.`,
    type: 'activity_reminder_one_hour' as const,
  };
}

export function buildActivityUpdateStableId(
  activityId: string,
  change: ImportantActivityChange,
): string {
  return `activity-${change}-${activityId}`;
}

export function buildReminderStableId(
  activityId: string,
  kind: 'day_before' | 'one_hour_before',
  userId: string,
): string {
  return `reminder-${kind}-${activityId}-${userId}`;
}
