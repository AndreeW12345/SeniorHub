import type { Activity } from '@/constants/activities';
import { parseDateValue } from '@/utils/date-time-format';

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

/** Upcoming non-cancelled activities sorted by date, nearest first (no limit). */
export function listUpcomingActivities(
  activities: Activity[],
  referenceDate: Date = new Date(),
): Activity[] {
  const today = startOfLocalDay(referenceDate).getTime();

  return activities
    .filter((activity) => {
      if (activity.isCancelled === true) {
        return false;
      }

      const activityDate = parseDateValue(activity.date);
      return activityDate !== null && activityDate.getTime() >= today;
    })
    .sort((a, b) => {
      const dateA = parseDateValue(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const dateB = parseDateValue(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });
}

/** Upcoming non-cancelled activities sorted by date, nearest first. */
export function getUpcomingActivities(
  activities: Activity[],
  limit: number,
  referenceDate: Date = new Date(),
): Activity[] {
  return listUpcomingActivities(activities, referenceDate).slice(0, Math.max(0, limit));
}
