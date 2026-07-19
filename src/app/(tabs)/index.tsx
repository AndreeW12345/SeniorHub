import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivitiesEmptyState } from '@/components/activities-empty-state';
import { ActivityCard } from '@/components/activity-card';
import { ActivityList, ActivityListItem } from '@/components/activity-list';
import { ActivityQuickFilterBar } from '@/components/activity-quick-filter-bar';
import { CategoryFilter } from '@/components/category-filter';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useActivitiesBrowse } from '@/contexts/activities-browse-context';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { browseActivities } from '@/utils/activity-browse';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AktiviteterScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { horizontalPadding, sectionGap, contentWidth } = useResponsive();
  const { activities, isLoading, refreshActivities } = useActivities();
  const {
    searchQuery,
    setSearchQuery,
    clearSearchQuery,
    selectedCategory,
    setSelectedCategory,
    quickFilters,
    toggleQuickFilter,
  } = useActivitiesBrowse();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const listOpacity = useRef(new Animated.Value(1)).current;

  const filteredActivities = useMemo(
    () =>
      browseActivities(activities, {
        query: searchQuery,
        category: selectedCategory,
        quickFilters,
      }),
    [activities, searchQuery, selectedCategory, quickFilters],
  );

  const hasActiveBrowse =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'Alla' ||
    quickFilters.length > 0;

  const showFirestoreEmptyState = !isLoading && activities.length === 0;
  const shouldCenterRemainingArea = isLoading || showFirestoreEmptyState;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    listOpacity.setValue(0.88);
    Animated.timing(listOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [filteredActivities, listOpacity]);

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
          footer={
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={clearSearchQuery}
            />
          }
        />

        <View
          style={[
            styles.filterBar,
            {
              paddingHorizontal: horizontalPadding,
              maxWidth: contentWidth,
            },
          ]}>
          <ActivityQuickFilterBar selected={quickFilters} onToggle={toggleQuickFilter} />
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
          <Animated.View style={[styles.listScroll, { opacity: listOpacity }]}>
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
                {selectedCategory !== 'Alla' ? (
                  <ThemedText type="bodyLarge" themeColor="textSecondary">
                    Kategori: {selectedCategory}
                  </ThemedText>
                ) : null}
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
                    Inga aktiviteter matchar din sökning.
                  </ThemedText>
                  {hasActiveBrowse ? (
                    <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
                      Prova att ändra sökord eller filter.
                    </ThemedText>
                  ) : null}
                </View>
              )}
            </ScrollView>
          </Animated.View>
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
    gap: Spacing.two,
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
