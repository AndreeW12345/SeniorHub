import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Activity } from '@/constants/activities';
import type { ActivityRegistration } from '@/constants/registrations';
import { subscribeActivityParticipantCount } from '@/services/activities/subscribe-activity-participant-count';
import { subscribeActivityRegistrations } from '@/services/registrations/subscribe-activity-registrations';
import {
  getSeatAvailability,
  isSeatAvailabilityFull,
  type SeatAvailability,
} from '@/utils/seat-availability';
import {
  getActivityParticipantCount,
  getActivityRegistrationAction,
  hasActivityParticipantLimit,
  isActivityRegistrationRequired,
} from '@/utils/activity-registration';
import { getWaitlistPosition, sortWaitlistFifo } from '@/utils/waitlist';

type UseActivitySeatAvailabilityResult = {
  availability: SeatAvailability;
  bookedCount: number;
  waitlistCount: number;
  waitlist: ActivityRegistration[];
  /** 1-based position when `registrationId` is on the waitlist. */
  getWaitlistPositionFor: (registrationId: string | null | undefined) => number | null;
  isFull: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  /** Instant local seat-count adjustment before the Firestore snapshot arrives. */
  adjustBookedCount: (delta: number) => void;
};

/**
 * Live registered + waitlist counts for an activity.
 * Booked count comes from activities/{id}.participants; waitlist from registrations.
 */
export function useActivitySeatAvailability(
  activity: Activity | undefined,
): UseActivitySeatAvailabilityResult {
  const needsLiveCount =
    !!activity &&
    (hasActivityParticipantLimit(activity) || isActivityRegistrationRequired(activity));

  const fallbackBooked = activity ? getActivityParticipantCount(activity) : 0;
  const [bookedCount, setBookedCount] = useState(fallbackBooked);
  const [waitlist, setWaitlist] = useState<ActivityRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(needsLiveCount);

  useEffect(() => {
    if (!activity || !needsLiveCount) {
      setBookedCount(fallbackBooked);
      setWaitlist([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    let bookedReady = false;
    let waitlistReady = false;

    const finishLoadingIfReady = () => {
      if (bookedReady && waitlistReady) {
        setIsLoading(false);
      }
    };

    const unsubscribeBookedCount = subscribeActivityParticipantCount(
      activity.id,
      (participants) => {
        setBookedCount(participants);
        bookedReady = true;
        finishLoadingIfReady();
      },
      () => {
        setBookedCount(fallbackBooked);
        bookedReady = true;
        finishLoadingIfReady();
      },
    );

    const unsubscribeWaitlist = subscribeActivityRegistrations(
      activity.id,
      (registrations) => {
        const waiting = sortWaitlistFifo(
          registrations.filter((registration) => registration.status === 'waitlist'),
        );
        setWaitlist(waiting);
        waitlistReady = true;
        finishLoadingIfReady();
      },
      () => {
        setWaitlist([]);
        waitlistReady = true;
        finishLoadingIfReady();
      },
      { includeStatuses: ['registered', 'waitlist'] },
    );

    return () => {
      unsubscribeBookedCount();
      unsubscribeWaitlist();
    };
  }, [activity, fallbackBooked, needsLiveCount]);

  const refresh = useCallback(async () => {
    // Count is kept live via Firestore subscription.
  }, []);

  const adjustBookedCount = useCallback((delta: number) => {
    if (!Number.isFinite(delta) || delta === 0) {
      return;
    }

    setBookedCount((current) => Math.max(0, current + Math.trunc(delta)));
  }, []);

  const waitlistCount = waitlist.length;
  const waitlistAvailable =
    !!activity && getActivityRegistrationAction(activity)?.method === 'seniorhub';

  const availability = activity
    ? getSeatAvailability(activity, bookedCount, {
        waitlistCount,
        waitlistAvailable,
      })
    : { kind: 'hidden' as const };

  const getWaitlistPositionFor = useCallback(
    (registrationId: string | null | undefined) => getWaitlistPosition(waitlist, registrationId),
    [waitlist],
  );

  return useMemo(
    () => ({
      availability,
      bookedCount,
      waitlistCount,
      waitlist,
      getWaitlistPositionFor,
      isFull: isSeatAvailabilityFull(availability),
      isLoading,
      refresh,
      adjustBookedCount,
    }),
    [
      availability,
      bookedCount,
      waitlistCount,
      waitlist,
      getWaitlistPositionFor,
      isLoading,
      refresh,
      adjustBookedCount,
    ],
  );
}
