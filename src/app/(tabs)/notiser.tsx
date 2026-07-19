import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { NotificationCard } from '@/components/notification-card';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useNotifications } from '@/contexts/notifications-context';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructiveAction } from '@/utils/confirm-alert';

/** Local notifications inbox – newest first. */
export default function NotificationScreen() {
  const theme = useTheme();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  } = useNotifications();

  const handleClearAll = () => {
    confirmDestructiveAction(
      'Rensa notiser',
      'Vill du verkligen ta bort alla notiser?',
      'Rensa alla',
      () => {
        clearAllNotifications();
      },
    );
  };

  return (
    <ScreenLayout title="Notiser" subtitle="Dina senaste uppdateringar">
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Laddar notiser...
          </ThemedText>
        </View>
      ) : notifications.length > 0 ? (
        <View style={styles.content}>
          <View style={styles.actions}>
            <Pressable
              onPress={markAllAsRead}
              accessibilityRole="button"
              accessibilityLabel="Markera alla som lästa"
              accessibilityState={{ disabled: unreadCount === 0 }}
              disabled={unreadCount === 0}
              style={({ pressed }) => [
                styles.actionButton,
                { borderColor: theme.primary, backgroundColor: theme.card },
                (pressed || unreadCount === 0) && styles.pressed,
                unreadCount === 0 && styles.disabled,
              ]}>
              <ThemedText type="bodyLarge" themeColor="primary" style={styles.actionButtonText}>
                Markera alla som lästa
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleClearAll}
              accessibilityRole="button"
              accessibilityLabel="Rensa alla notiser"
              style={({ pressed }) => [
                styles.actionButton,
                { borderColor: theme.favorite, backgroundColor: theme.card },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" themeColor="favorite" style={styles.actionButtonText}>
                Rensa alla notiser
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.list}>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={(item) => {
                  if (!item.read) {
                    markAsRead(item.id);
                  }
                }}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={[styles.emptyState, CardShadow, { backgroundColor: theme.card }]}>
          <SymbolView
            tintColor={theme.primary}
            name={{
              ios: 'bell',
              android: 'notifications_none',
              web: 'notifications_none',
            }}
            size={52}
          />
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
            Du har inga notiser ännu.
          </ThemedText>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.seven,
    gap: Spacing.four,
  },
  content: {
    gap: Spacing.four,
  },
  actions: {
    gap: Spacing.three,
  },
  actionButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  actionButtonText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  list: {
    gap: Spacing.three,
  },
  emptyState: {
    borderRadius: Radius.xl,
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 340,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
});
