import type { Activity } from '@/constants/activities';
import type { LocalRegistration, LocalRegistrationStatus } from '@/contexts/registrations-context';
import { parseDateValue, parseTimeValue, splitStoredTimeRange } from '@/utils/date-time-format';

export type MyBooking = {
  activity: Activity;
  status: LocalRegistrationStatus;
};

export function getBookingStatusLabel(status: LocalRegistrationStatus): string {
  return status === 'waitlist' ? 'Reservplats' : 'Anmäld';
}

function getActivitySortTimestamp(activity: Activity): number {
  const date = parseDateValue(activity.date);
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  const { startTime } = splitStoredTimeRange(activity.time);
  const time = parseTimeValue(startTime);

  if (time) {
    date.setHours(time.getHours(), time.getMinutes(), 0, 0);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.getTime();
}

/** Builds booking rows for activities that still exist, nearest date first. */
export function buildSortedMyBookings(
  bookings: LocalRegistration[],
  getActivityById: (id: string) => Activity | undefined,
): MyBooking[] {
  return bookings
    .map((booking) => {
      const activity = getActivityById(booking.activityId);
      if (!activity) {
        return null;
      }

      return {
        activity,
        status: (booking.status ?? 'registered') as LocalRegistrationStatus,
      };
    })
    .filter((booking): booking is MyBooking => booking !== null)
    .sort(
      (a, b) => getActivitySortTimestamp(a.activity) - getActivitySortTimestamp(b.activity),
    );
}
