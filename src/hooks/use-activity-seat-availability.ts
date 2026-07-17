import { useCallback, useEffect, useState } from 'react';

import type { Activity } from '@/constants/activities';
import { subscribeActivityRegistrations } from '@/services/registrations/subscribe-activity-registrations';
import {
  getSeatAvailability,
  isSeatAvailabilityFull,
  type SeatAvailability,
} from '@/utils/seat-availability';
import {
  getActivityParticipantCount,
  hasActivityParticipantLimit,
  isActivityRegistrationRequired,
} from '@/utils/activity-registration';

type UseActivitySeatAvailabilityResult = {
  availability: SeatAvailability;
  bookedCount: number;
  isFull: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

/**
 * Live registered participant count and seat availability for an activity.
 * Updates automatically when registrations change (e.g. cancel + waitlist promotion).
 */
export function useActivitySeatAvailability(
  activity: Activity | undefined,
): UseActivitySeatAvailabilityResult {
  const needsLiveCount =
    !!activity &&
    (hasActivityParticipantLimit(activity) || isActivityRegistrationRequired(activity));

  const fallbackBooked = activity ? getActivityParticipantCount(activity) : 0;
  const [bookedCount, setBookedCount] = useState(fallbackBooked);
  const [isLoading, setIsLoading] = useState(needsLiveCount);

  useEffect(() => {
    if (!activity || !needsLiveCount) {
      setBookedCount(fallbackBooked);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeActivityRegistrations(
      activity.id,
      (registrations) => {
        setBookedCount(registrations.length);
        setIsLoading(false);
      },
      () => {
        setBookedCount(fallbackBooked);
        setIsLoading(false);
      },
      { includeStatuses: ['registered'] },
    );

    return unsubscribe;
  }, [activity, fallbackBooked, needsLiveCount]);

  const refresh = useCallback(async () => {
    // Count is kept live via Firestore subscription.
  }, []);

  const availability = activity
    ? getSeatAvailability(activity, bookedCount)
    : { kind: 'hidden' as const };

  return {
    availability,
    bookedCount,
    isFull: isSeatAvailabilityFull(availability),
    isLoading,
    refresh,
  };
}
