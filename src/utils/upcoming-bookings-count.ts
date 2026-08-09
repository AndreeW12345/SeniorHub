import type { Activity } from '@/constants/activities';
import type { LocalRegistration } from '@/contexts/registrations-context';
import { parseDateValue } from '@/utils/date-time-format';
import { buildSortedMyBookings } from '@/utils/my-bookings';

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

/** Counts the user's upcoming registered or waitlisted activities. */
export function countUpcomingBookings(
  bookings: LocalRegistration[],
  getActivityById: (id: string) => Activity | undefined,
  referenceDate: Date = new Date(),
): number {
  const today = startOfLocalDay(referenceDate).getTime();

  return buildSortedMyBookings(bookings, getActivityById).filter(({ activity, status }) => {
    if (activity.isCancelled === true) {
      return false;
    }

    if (status !== 'registered' && status !== 'waitlist') {
      return false;
    }

    const activityDate = parseDateValue(activity.date);
    return activityDate !== null && activityDate.getTime() >= today;
  }).length;
}
