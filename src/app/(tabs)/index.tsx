import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivitiesEmptyState } from '@/components/activities-empty-state';
import { ActivityCard } from '@/components/activity-card';
import { ActivityList, ActivityListItem } from '@/components/activity-list';
import { CategoryFilter } from '@/components/category-filter';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { type Category } from '@/constants/activities';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

export default function AktiviteterScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { horizontalPadding, sectionGap, contentWidth } = useResponsive();
  const { activities, isLoading, filterActivities, refreshActivities } = useActivities();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Alla');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredActivities = useMemo(
    () => filterActivities(searchQuery, selectedCategory),
    [filterActivities, searchQuery, selectedCategory],
  );

  const showFirestoreEmptyState = !isLoading && activities.length === 0;
  const shouldCenterRemainingArea = isLoading || showFirestoreEmptyState;

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await refreshActivities();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topSection}>
        <ScreenHeader
          title="Aktiviteter"
          subtitle="Upptäck vad som händer i kommunen"
          footer={<SearchBar value={searchQuery} onChangeText={setSearchQuery} />}
        />

        <View
          style={[
            styles.filterBar,
            {
              paddingHorizontal: horizontalPadding,
              maxWidth: contentWidth,
            },
          ]}>
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
        </View>
      </View>

      <View
        style={[
          styles.remainingArea,
          shouldCenterRemainingArea && styles.remainingAreaCentered,
          shouldCenterRemainingArea && { paddingHorizontal: horizontalPadding },
          !shouldCenterRemainingArea && {
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="bodyLarge" themeColor="textSecondary">
              Laddar aktiviteter...
            </ThemedText>
          </View>
        ) : showFirestoreEmptyState ? (
          <ActivitiesEmptyState onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        ) : (
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: horizontalPadding,
                paddingTop: sectionGap,
                paddingBottom: Spacing.four,
                maxWidth: contentWidth,
                gap: sectionGap,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.resultsHeader}>
              <ThemedText type="sectionTitle">
                {filteredActivities.length === 1
                  ? '1 aktivitet'
                  : `${filteredActivities.length} aktiviteter`}
              </ThemedText>
              {selectedCategory !== 'Alla' && (
                <ThemedText type="bodyLarge" themeColor="textSecondary">
                  Kategori: {selectedCategory}
                </ThemedText>
              )}
            </View>

            {filteredActivities.length > 0 ? (
              <ActivityList>
                {filteredActivities.map((activity) => (
                  <ActivityListItem key={activity.id}>
                    <ActivityCard activity={activity} />
                  </ActivityListItem>
                ))}
              </ActivityList>
            ) : (
              <View style={styles.filterEmptyState}>
                <ThemedText type="subtitle" style={styles.emptyTitle}>
                  Inga aktiviteter hittades
                </ThemedText>
                <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
                  Prova att ändra sökord eller välj en annan kategori.
                </ThemedText>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  topSection: {
    flexShrink: 0,
  },
  filterBar: {
    alignSelf: 'center',
    width: '100%',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  remainingArea: {
    flex: 1,
    flexBasis: 0,
    minHeight: 0,
    width: '100%',
  },
  remainingAreaCentered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingState: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  listScroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
  },
  resultsHeader: {
    gap: Spacing.two,
  },
  filterEmptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.seven,
    gap: Spacing.four,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 360,
  },
});
