import { useEffect, useMemo, useRef } from 'react';
import type { Unsubscribe } from 'firebase/firestore';

import type { ActivityAnnouncement } from '@/constants/announcements';
import { useNotifications } from '@/contexts/notifications-context';
import { useRegistrations } from '@/contexts/registrations-context';
import { subscribeActivityAnnouncements } from '@/services/announcements';
import { createActivityAnnouncementNotification } from '@/utils/notifications';

/**
 * Syncs admin activity announcements into the local Notiser inbox for devices
 * that have a confirmed booking for the activity.
 */
export function ActivityAnnouncementsNotifier() {
  const { localBookings, isLoading: registrationsLoading } = useRegistrations();
  const {
    addNotification,
    notifications,
    isLoading: notificationsLoading,
  } = useNotifications();
  const knownAnnouncementIdsRef = useRef<Set<string>>(new Set());

  const registeredActivityIds = useMemo(
    () =>
      localBookings
        .filter((booking) => (booking.status ?? 'registered') === 'registered')
        .map((booking) => booking.activityId)
        .filter((activityId, index, list) => list.indexOf(activityId) === index)
        .sort(),
    [localBookings],
  );

  const registeredActivityIdsKey = registeredActivityIds.join('|');

  useEffect(() => {
    for (const notification of notifications) {
      if (
        notification.type === 'activity_announcement' &&
        notification.id.startsWith('announcement-')
      ) {
        knownAnnouncementIdsRef.current.add(notification.id.slice('announcement-'.length));
      }
    }
  }, [notifications]);

  useEffect(() => {
    if (registrationsLoading || notificationsLoading) {
      return;
    }

    const activityIds = registeredActivityIdsKey
      ? registeredActivityIdsKey.split('|').filter(Boolean)
      : [];

    if (activityIds.length === 0) {
      return;
    }

    const unsubscribers: Unsubscribe[] = [];

    const ingestAnnouncement = (announcement: ActivityAnnouncement) => {
      if (knownAnnouncementIdsRef.current.has(announcement.id)) {
        return;
      }

      knownAnnouncementIdsRef.current.add(announcement.id);
      addNotification(
        createActivityAnnouncementNotification({
          announcementId: announcement.id,
          title: announcement.title,
          message: announcement.message,
          createdAt: announcement.createdAt,
        }),
      );
    };

    for (const activityId of activityIds) {
      const unsubscribe = subscribeActivityAnnouncements(activityId, (announcements) => {
        for (const announcement of announcements) {
          ingestAnnouncement(announcement);
        }
      });
      unsubscribers.push(unsubscribe);
    }

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [
    registrationsLoading,
    notificationsLoading,
    registeredActivityIdsKey,
    addNotification,
  ]);

  return null;
}
