import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useNotificationPreferences } from '@/contexts/notification-preferences-context';
import {
  configureNotificationHandler,
  getOrCreateDeviceId,
  registerPushNotifications,
  syncUserNotificationPreferences,
} from '@/services/notifications';

/**
 * On first app open: request notification permission, fetch Expo push token,
 * and store token + preferences in Firestore for future server push.
 */
export function PushNotificationsBootstrap() {
  const { preferences, isLoading } = useNotificationPreferences();
  const hasRegisteredRef = useRef(false);
  const lastSyncedPrefsRef = useRef<string | null>(null);

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (isLoading || Platform.OS === 'web' || hasRegisteredRef.current) {
      return;
    }

    hasRegisteredRef.current = true;

    void registerPushNotifications({ preferences }).finally(() => {
      lastSyncedPrefsRef.current = JSON.stringify(preferences);
    });
  }, [isLoading, preferences]);

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
      await syncUserNotificationPreferences({ deviceId, preferences });
    })();
  }, [isLoading, preferences]);

  return null;
}
