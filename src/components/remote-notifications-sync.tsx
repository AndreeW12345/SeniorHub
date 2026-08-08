import { useEffect, useRef } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notifications-context';
import { subscribeUserNotifications } from '@/services/notifications/subscribe-user-notifications';

/**
 * Syncs Firestore-delivered push/inbox notifications into the local Notiser inbox.
 * Server writes to users/{uid}/notifications; this component ingests them on-device.
 */
export function RemoteNotificationsSync() {
  const { user } = useAuth();
  const { addNotification, notifications, isLoading } = useNotifications();
  const knownRemoteIdsRef = useRef<Set<string>>(new Set());
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.uid?.trim() ?? null;

    if (activeUserIdRef.current !== userId) {
      activeUserIdRef.current = userId;
      knownRemoteIdsRef.current = new Set();
    }
  }, [user?.uid]);

  useEffect(() => {
    for (const notification of notifications) {
      if (notification.id.startsWith('remote-')) {
        knownRemoteIdsRef.current.add(notification.id);
      }
    }
  }, [notifications]);

  useEffect(() => {
    const userId = user?.uid?.trim();
    if (!userId || isLoading) {
      return;
    }

    const unsubscribe = subscribeUserNotifications(userId, (remoteNotifications) => {
      for (const remote of remoteNotifications) {
        const localId = `remote-${remote.id}`;
        if (knownRemoteIdsRef.current.has(localId)) {
          continue;
        }

        knownRemoteIdsRef.current.add(localId);

        addNotification({
          id: localId,
          icon: remote.icon,
          title: remote.title,
          description: remote.description,
          type: remote.type,
          createdAt: remote.createdAt.toISOString(),
        });
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [user?.uid, isLoading, addNotification]);

  return null;
}
