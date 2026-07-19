import { useEffect, useRef } from 'react';

import { useActivities } from '@/contexts/activities-context';
import { useNotifications } from '@/contexts/notifications-context';
import { useRegistrations } from '@/contexts/registrations-context';
import { createWaitlistPromotedNotification } from '@/utils/notifications';

/**
 * Watches local registration status and creates a notification when a waitlist
 * entry is promoted to registered (seat freed by someone else cancelling).
 */
export function WaitlistPromotionNotifier() {
  const { localBookings } = useRegistrations();
  const { getActivityById } = useActivities();
  const { addNotification } = useNotifications();
  const previousWaitlistIdsRef = useRef<Set<string> | null>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    const waitlistIds = new Set(
      localBookings
        .filter((booking) => booking.status === 'waitlist')
        .map((booking) => booking.activityId),
    );

    const registeredIds = new Set(
      localBookings
        .filter((booking) => (booking.status ?? 'registered') === 'registered')
        .map((booking) => booking.activityId),
    );

    if (!isReadyRef.current) {
      previousWaitlistIdsRef.current = waitlistIds;
      isReadyRef.current = true;
      return;
    }

    const previousWaitlistIds = previousWaitlistIdsRef.current ?? new Set<string>();

    for (const activityId of previousWaitlistIds) {
      if (!waitlistIds.has(activityId) && registeredIds.has(activityId)) {
        const activityTitle = getActivityById(activityId)?.title?.trim() || 'aktiviteten';
        addNotification(createWaitlistPromotedNotification(activityTitle));
      }
    }

    previousWaitlistIdsRef.current = waitlistIds;
  }, [localBookings, getActivityById, addNotification]);

  return null;
}
