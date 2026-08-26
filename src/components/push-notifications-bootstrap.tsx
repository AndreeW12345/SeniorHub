import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useNotificationPreferences } from '@/contexts/notification-preferences-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import {
  configureNotificationHandler,
  persistRefreshedPushToken,
  registerPushNotifications,
  syncUserNotificationPreferences,
} from '@/services/notifications';

/**
 * On first app open: request notification permission, fetch FCM push token,
 * and store token + preferences in Firestore for server-side push.
 */
export function PushNotificationsBootstrap() {
  const { user, isInitializing: isAuthInitializing } = useAuth();
  const { isLoading: isProfileLoading } = useUserProfile();
  const { preferences, isLoading: isPreferencesLoading } = useNotificationPreferences();
  const hasRegisteredRef = useRef(false);
  const lastRegisteredUserIdRef = useRef<string | null>(null);
  const lastPersistedProfileUserRef = useRef<string | null>(null);
  const lastSyncedPrefsRef = useRef<string | null>(null);
  const userId = user?.uid ?? null;

  const isBootstrapReady =
    !isAuthInitializing && !isProfileLoading && !isPreferencesLoading && Platform.OS !== 'web';

  const canPersistToFirestore = isBootstrapReady && Boolean(userId);

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!isBootstrapReady) {
      return;
    }

    const shouldRegister =
      !hasRegisteredRef.current ||
      lastRegisteredUserIdRef.current !== userId ||
      (canPersistToFirestore && lastPersistedProfileUserRef.current !== userId);

    if (!shouldRegister) {
      return;
    }

    hasRegisteredRef.current = true;
    lastRegisteredUserIdRef.current = userId;

    void registerPushNotifications({ preferences, userId }).finally(() => {
      lastSyncedPrefsRef.current = JSON.stringify(preferences);
      if (canPersistToFirestore && userId) {
        lastPersistedProfileUserRef.current = userId;
      }
    });
  }, [canPersistToFirestore, isBootstrapReady, preferences, userId]);

  useEffect(() => {
    if (!canPersistToFirestore) {
      return;
    }

    const serialized = JSON.stringify(preferences);
    if (lastSyncedPrefsRef.current === null || lastSyncedPrefsRef.current === serialized) {
      return;
    }

    lastSyncedPrefsRef.current = serialized;

    void syncUserNotificationPreferences({ userId, preferences });
  }, [canPersistToFirestore, preferences, userId]);

  useEffect(() => {
    if (Platform.OS === 'web' || !canPersistToFirestore) {
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
  }, [canPersistToFirestore, userId, preferences]);

  return null;
}
