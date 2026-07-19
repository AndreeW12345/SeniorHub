import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { AppNotification } from '@/constants/notifications';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatNotificationTimestamp } from '@/utils/notifications';

type NotificationCardProps = {
  notification: AppNotification;
  onPress?: (notification: AppNotification) => void;
};

/** Single notification row for the Notiser screen. */
export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const theme = useTheme();
  const isUnread = !notification.read;
  const timestampLabel = formatNotificationTimestamp(notification.createdAt);

  return (
    <Pressable
      onPress={() => onPress?.(notification)}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.description}. ${timestampLabel}.${isUnread ? ' Oläst.' : ''}`}
      style={({ pressed }) => [
        styles.card,
        CardShadow,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.iconWrap}>
        <ThemedText type="sectionTitle" style={styles.icon}>
          {notification.icon}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <ThemedText type="bodyLarge" style={styles.title}>
            {notification.title}
          </ThemedText>
          {isUnread ? (
            <View
              style={[styles.unreadDot, { backgroundColor: theme.primary }]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ) : null}
        </View>

        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.description}>
          {notification.description}
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary" style={styles.timestamp}>
          {timestampLabel}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  iconWrap: {
    width: 44,
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  icon: {
    fontSize: 28,
    lineHeight: 34,
  },
  content: {
    flex: 1,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
  },
  description: {
    lineHeight: 30,
  },
  timestamp: {
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.92,
  },
});
