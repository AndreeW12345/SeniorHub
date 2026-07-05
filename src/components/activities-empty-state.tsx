import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CALENDAR_ICON_SIZE = 96;

type ActivitiesEmptyStateProps = {
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
};

export function ActivitiesEmptyState({ onRefresh, isRefreshing = false }: ActivitiesEmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      <SymbolView
        tintColor={theme.primary}
        name={{ ios: 'calendar', android: 'event', web: 'event' }}
        size={CALENDAR_ICON_SIZE}
      />

      <View style={styles.textBlock}>
        <ThemedText type="subtitle" style={styles.title}>
          Inga aktiviteter just nu
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.description}>
          Det finns inga planerade aktiviteter för tillfället. Titta gärna tillbaka snart.
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Uppdatera aktiviteter"
        accessibilityState={{ disabled: isRefreshing, busy: isRefreshing }}
        disabled={isRefreshing}
        onPress={() => void onRefresh()}
        style={({ pressed }) => [
          styles.refreshButton,
          {
            backgroundColor: isRefreshing ? theme.primaryLight : theme.primary,
            borderColor: theme.primary,
            borderWidth: isRefreshing ? 2 : 0,
          },
          !isRefreshing && pressed && styles.refreshButtonPressed,
        ]}>
        {isRefreshing ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <ThemedText type="bodyLarge" style={styles.refreshButtonText}>
            Uppdatera
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 500,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five + 4,
    paddingVertical: Spacing.six + Spacing.two,
    alignItems: 'center',
    gap: Spacing.six,
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 32,
  },
  refreshButton: {
    width: '100%',
    minHeight: 60,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  refreshButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
