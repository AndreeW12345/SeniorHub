import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notifications-context';

const theme = Colors.light;

function formatUnreadBadge(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export default function AppTabs() {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <NativeTabs
      backgroundColor={theme.background}
      indicatorColor={theme.primaryLight}
      badgeBackgroundColor={theme.favorite}
      badgeTextColor="#FFFFFF"
      labelStyle={{
        selected: { color: theme.primary },
        default: { color: theme.textSecondary },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Aktiviteter</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="karta">
        <NativeTabs.Trigger.Label>Karta</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favoriter">
        <NativeTabs.Trigger.Label>Favoriter</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="heart.fill" md="favorite" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mina-bokningar">
        <NativeTabs.Trigger.Label>Mina bokningar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="ticket.fill" md="confirmation_number" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="information">
        <NativeTabs.Trigger.Label>Information</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="info.circle.fill" md="info" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="notiser">
        <NativeTabs.Trigger.Label>Notiser</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bell.fill" md="notifications" />
        {unreadCount > 0 ? (
          <NativeTabs.Trigger.Badge>{formatUnreadBadge(unreadCount)}</NativeTabs.Trigger.Badge>
        ) : null}
      </NativeTabs.Trigger>

      {isAuthenticated ? (
        <NativeTabs.Trigger name="admin">
          <NativeTabs.Trigger.Label>Admin</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
        </NativeTabs.Trigger>
      ) : null}
    </NativeTabs>
  );
}
