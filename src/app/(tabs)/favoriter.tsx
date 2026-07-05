import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ActivityCard } from '@/components/activity-card';
import { ActivityList, ActivityListItem } from '@/components/activity-list';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useFavorites } from '@/contexts/favorites-context';
import { useTheme } from '@/hooks/use-theme';

export default function FavoriterScreen() {
  const theme = useTheme();
  const { getActivitiesByIds } = useActivities();
  const { favoriteIds, isLoading } = useFavorites();

  const favorites = useMemo(
    () => getActivitiesByIds(favoriteIds),
    [favoriteIds, getActivitiesByIds],
  );

  return (
    <ScreenLayout title="Favoriter" subtitle="Dina sparade aktiviteter">
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Laddar favoriter...
          </ThemedText>
        </View>
      ) : favorites.length > 0 ? (
        <ActivityList>
          {favorites.map((activity) => (
            <ActivityListItem key={activity.id}>
              <ActivityCard activity={activity} />
            </ActivityListItem>
          ))}
        </ActivityList>
      ) : (
        <View style={[styles.emptyState, CardShadow, { backgroundColor: theme.card }]}>
          <SymbolView
            tintColor={theme.primary}
            name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
            size={52}
          />
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            Inga favoriter ännu
          </ThemedText>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
            Tryck på hjärtat på en aktivitet för att spara den här.
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
  emptyState: {
    borderRadius: Radius.xl,
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 340,
  },
});
