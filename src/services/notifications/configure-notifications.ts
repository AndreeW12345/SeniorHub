import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let isConfigured = false;

/** Shows local/push notifications while the app is in the foreground. */
export function configureNotificationHandler() {
  if (isConfigured || Platform.OS === 'web') {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  isConfigured = true;
}

/** Android requires a channel before permissions/token prompts work reliably. */
export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('activity-reminders', {
    name: 'Aktivitetspåminnelser',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#004E87',
  });
}
