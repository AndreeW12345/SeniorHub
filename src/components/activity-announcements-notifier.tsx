import { useEffect, useMemo, useRef } from 'react';
import type { Unsubscribe } from 'firebase/firestore';

import type { ActivityAnnouncement } from '@/constants/announcements';
import { useNotificationPreferences } from '@/contexts/notification-preferences-context';
import { useNotifications } from '@/contexts/notifications-context';
import { useRegistrations } from '@/contexts/registrations-context';
import { subscribeActivityAnnouncements } from '@/services/announcements';
import {
  createActivityAnnouncementNotification,
  createActivityUpdateNotification,
} from '@/utils/notifications';

/**
 * Syncs activity announcements (manual + automatic updates) into the local
 * Notiser inbox for devices that have a confirmed booking for the activity.
 * Automatic activity updates respect the "Aktivitetsuppdateringar" preference.
 */
export function ActivityAnnouncementsNotifier() {
  const { localBookings, isLoading: registrationsLoading } = useRegistrations();
  const { preferences } = useNotificationPreferences();
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
        (notification.type === 'activity_announcement' ||
          notification.type === 'activity_update') &&
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

      const isActivityUpdate = announcement.kind === 'activity_update';

      if (isActivityUpdate && !preferences.activityUpdates) {
        // Remember ids while the preference is off so turning it on later
        // does not flood the inbox with updates the user already opted out of.
        knownAnnouncementIdsRef.current.add(announcement.id);
        return;
      }

      knownAnnouncementIdsRef.current.add(announcement.id);

      if (isActivityUpdate) {
        addNotification(
          createActivityUpdateNotification({
            announcementId: announcement.id,
            icon: announcement.icon || '📢',
            title: announcement.title,
            message: announcement.message,
            createdAt: announcement.createdAt,
          }),
        );
        return;
      }

      addNotification(
        createActivityAnnouncementNotification({
          announcementId: announcement.id,
          title: announcement.title,
          message: announcement.message,
          createdAt: announcement.createdAt,
          icon: announcement.icon,
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
    preferences.activityUpdates,
  ]);

  return null;
}
