import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors, TabBarColors } from '@/constants/theme';
import { useNotifications } from '@/contexts/notifications-context';

const theme = Colors.light;

function formatUnreadBadge(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export default function AppTabs() {
  const { unreadCount } = useNotifications();

  return (
    <NativeTabs
      backgroundColor={TabBarColors.background}
      indicatorColor={TabBarColors.activeTab}
      shadowColor={TabBarColors.border}
      badgeBackgroundColor={theme.favorite}
      badgeTextColor="#FFFFFF"
      iconColor={theme.primary}
      labelStyle={{
        selected: { color: theme.primary },
        default: { color: theme.primary },
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

      <NativeTabs.Trigger name="mer">
        <NativeTabs.Trigger.Label>Mer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="ellipsis.circle.fill" md="menu" />
        {unreadCount > 0 ? (
          <NativeTabs.Trigger.Badge>{formatUnreadBadge(unreadCount)}</NativeTabs.Trigger.Badge>
        ) : null}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
