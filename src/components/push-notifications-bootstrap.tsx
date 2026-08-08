import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useNotificationPreferences } from '@/contexts/notification-preferences-context';
import {
  configureNotificationHandler,
  getOrCreateDeviceId,
  persistRefreshedPushToken,
  registerPushNotifications,
  syncUserNotificationPreferences,
} from '@/services/notifications';

/**
 * On first app open: request notification permission, fetch FCM push token,
 * and store token + preferences in Firestore for server-side push.
 */
export function PushNotificationsBootstrap() {
  const { user } = useAuth();
  const { preferences, isLoading } = useNotificationPreferences();
  const hasRegisteredRef = useRef(false);
  const lastRegisteredUserIdRef = useRef<string | null>(null);
  const lastSyncedPrefsRef = useRef<string | null>(null);
  const userId = user?.uid ?? null;

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (isLoading || Platform.OS === 'web') {
      return;
    }

    const shouldRegister =
      !hasRegisteredRef.current || lastRegisteredUserIdRef.current !== userId;

    if (!shouldRegister) {
      return;
    }

    hasRegisteredRef.current = true;
    lastRegisteredUserIdRef.current = userId;

    void registerPushNotifications({ preferences, userId }).finally(() => {
      lastSyncedPrefsRef.current = JSON.stringify(preferences);
    });
  }, [isLoading, preferences, userId]);

  useEffect(() => {
    if (isLoading || Platform.OS === 'web') {
      return;
    }

    const serialized = JSON.stringify(preferences);
    if (lastSyncedPrefsRef.current === null || lastSyncedPrefsRef.current === serialized) {
      return;
    }

    lastSyncedPrefsRef.current = serialized;

    void (async () => {
      const deviceId = await getOrCreateDeviceId();
      await syncUserNotificationPreferences({ deviceId, userId, preferences });
    })();
  }, [isLoading, preferences, userId]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const subscription = Notifications.addPushTokenListener((token) => {
      const fcmToken = token.data?.trim();
      if (!fcmToken) {
        return;
      }

      void persistRefreshedPushToken({ fcmToken, userId, preferences });
    });

    return () => {
      subscription.remove();
    };
  }, [userId, preferences]);

  return null;
}
