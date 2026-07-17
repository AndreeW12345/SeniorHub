import { useCallback, useEffect, useState } from 'react';

import type { Activity } from '@/constants/activities';
import { countActivityRegistrations } from '@/services/registrations/count-registrations';
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
 * Loads registered participant count and derives seat availability for an activity.
 * Ready for waitlist: countActivityRegistrations(..., 'waitlist') can be added later.
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

  const refresh = useCallback(async () => {
    if (!activity || !needsLiveCount) {
      setBookedCount(fallbackBooked);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const count = await countActivityRegistrations(activity.id, 'registered');
      setBookedCount(count);
    } catch (error) {
      console.warn('[SeniorHub] Kunde inte hämta antal anmälda:', error);
      setBookedCount(fallbackBooked);
    } finally {
      setIsLoading(false);
    }
  }, [activity, fallbackBooked, needsLiveCount]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
