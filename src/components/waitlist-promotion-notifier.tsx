import { useEffect, useRef } from 'react';

import { useActivities } from '@/contexts/activities-context';
import { useNotificationPreferences } from '@/contexts/notification-preferences-context';
import { useNotifications } from '@/contexts/notifications-context';
import { useRegistrations } from '@/contexts/registrations-context';
import {
  scheduleActivityReminders,
  sendLocalBookingConfirmation,
} from '@/services/notifications';
import { createWaitlistPromotedNotification } from '@/utils/notifications';

/**
 * Watches local registration status and creates a notification when a waitlist
 * entry is promoted to registered (seat freed by someone else cancelling).
 */
export function WaitlistPromotionNotifier() {
  const { localBookings } = useRegistrations();
  const { getActivityById } = useActivities();
  const { addNotification } = useNotifications();
  const { preferences } = useNotificationPreferences();
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
        const activity = getActivityById(activityId);
        const activityTitle = activity?.title?.trim() || 'aktiviteten';
        addNotification(createWaitlistPromotedNotification(activityTitle));

        if (activity) {
          void sendLocalBookingConfirmation(activityTitle);
          void scheduleActivityReminders(activity, preferences);
        }
      }
    }

    previousWaitlistIdsRef.current = waitlistIds;
  }, [localBookings, getActivityById, addNotification, preferences]);

  return null;
}
