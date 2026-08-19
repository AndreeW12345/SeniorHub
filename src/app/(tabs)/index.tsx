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
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivitiesEmptyState } from '@/components/activities-empty-state';
import { ActivityCard } from '@/components/activity-card';
import { ActivityList, ActivityListItem } from '@/components/activity-list';
import { ActivityQuickFilterBar } from '@/components/activity-quick-filter-bar';
import { CategoryFilter } from '@/components/category-filter';
import { HomeAuthenticatedWelcome } from '@/components/home/home-authenticated-welcome';
import { HomeFeatureCards } from '@/components/home/home-feature-cards';
import { HomeHeroSection } from '@/components/home/home-hero-section';
import { HomeOrganizerCta } from '@/components/home/home-organizer-cta';
import { HomeQuickSummary } from '@/components/home/home-quick-summary';
import { HomeUpcomingSection } from '@/components/home/home-upcoming-section';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useActivitiesBrowse } from '@/contexts/activities-browse-context';
import { useAuth } from '@/contexts/auth-context';
import { useFavorites } from '@/contexts/favorites-context';
import { useNotifications } from '@/contexts/notifications-context';
import { useRegistrations } from '@/contexts/registrations-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { browseActivities } from '@/utils/activity-browse';
import { getUpcomingActivities } from '@/utils/upcoming-activities';
import { countUpcomingBookings } from '@/utils/upcoming-bookings-count';
import { getUserFirstName } from '@/utils/user-display-name';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const UPCOMING_PREVIEW_LIMIT = 3;

export default function AktiviteterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { horizontalPadding, sectionGap, contentWidth, isDesktop } = useResponsive();
  const { isSignedIn, user, isInitializing } = useAuth();
  const { profile } = useUserProfile();
  const { favoriteIds } = useFavorites();
  const { unreadCount } = useNotifications();
  const { localBookings } = useRegistrations();
  const { activities, isLoading, refreshActivities, getActivityById } = useActivities();
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
  const scrollRef = useRef<ScrollView>(null);
  const pageBodyOffsetRef = useRef(0);
  const browseSectionOffsetRef = useRef(0);
  const listOpacity = useRef(new Animated.Value(1)).current;

  const firstName = useMemo(() => getUserFirstName(profile, user), [profile, user]);

  const filteredActivities = useMemo(
    () =>
      browseActivities(activities, {
        query: searchQuery,
        category: selectedCategory,
        quickFilters,
      }),
    [activities, searchQuery, selectedCategory, quickFilters],
  );

  const upcomingActivities = useMemo(
    () => getUpcomingActivities(activities, isDesktop ? 4 : UPCOMING_PREVIEW_LIMIT),
    [activities, isDesktop],
  );

  const upcomingBookingsCount = useMemo(
    () => countUpcomingBookings(localBookings, getActivityById),
    [localBookings, getActivityById],
  );

  const hasActiveBrowse =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'Alla' ||
    quickFilters.length > 0;

  const showFirestoreEmptyState = !isLoading && activities.length === 0;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isSignedIn]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    listOpacity.setValue(0.88);
    Animated.timing(listOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [filteredActivities, listOpacity]);

  const scrollToBrowseSection = () => {
    const targetY =
      pageBodyOffsetRef.current + browseSectionOffsetRef.current - Spacing.three;

    scrollRef.current?.scrollTo({
      y: Math.max(0, targetY),
      animated: true,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await refreshActivities();
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderBrowseSection = () => (
    <View
      onLayout={(event) => {
        browseSectionOffsetRef.current = event.nativeEvent.layout.y;
      }}
      style={styles.browseSection}>
      <View style={styles.browseHeader}>
        <ThemedText type="sectionTitle" accessibilityRole="header">
          Alla aktiviteter
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Sök, filtrera och hitta något som passar dig.
        </ThemedText>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={clearSearchQuery}
      />

      <View style={styles.filterBar}>
        <ActivityQuickFilterBar selected={quickFilters} onToggle={toggleQuickFilter} />
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </View>

      <Animated.View style={{ opacity: listOpacity }}>
        <View style={styles.resultsHeader}>
          <ThemedText type="cardTitle">
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
      </Animated.View>
    </View>
  );

  const renderActivitiesContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Laddar aktiviteter...
          </ThemedText>
        </View>
      );
    }

    if (showFirestoreEmptyState) {
      return <ActivitiesEmptyState onRefresh={handleRefresh} isRefreshing={isRefreshing} />;
    }

    if (isSignedIn) {
      return (
        <>
          <HomeUpcomingSection
            activities={upcomingActivities}
            onShowAllPress={scrollToBrowseSection}
            useGridLayout
          />
          <HomeQuickSummary
            upcomingBookings={upcomingBookingsCount}
            favoriteCount={favoriteIds.length}
            unreadNotifications={unreadCount}
          />
          {renderBrowseSection()}
        </>
      );
    }

    return (
      <>
        <HomeUpcomingSection
          activities={upcomingActivities}
          onShowAllPress={scrollToBrowseSection}
        />
        {renderBrowseSection()}
      </>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {isInitializing ? (
          <View style={[styles.authLoading, { paddingTop: insets.top + Spacing.six }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : isSignedIn ? (
          <HomeAuthenticatedWelcome firstName={firstName} />
        ) : (
          <HomeHeroSection
            onExplorePress={scrollToBrowseSection}
            onCreateAccountPress={() => router.push('/register' as Href)}
            onLoginPress={() => router.push('/login' as Href)}
          />
        )}

        <View
          onLayout={(event) => {
            pageBodyOffsetRef.current = event.nativeEvent.layout.y;
          }}
          style={[
            styles.pageBody,
            {
              paddingHorizontal: horizontalPadding,
              maxWidth: contentWidth,
              gap: sectionGap,
            },
          ]}>
          {!isSignedIn && !isInitializing ? <HomeFeatureCards /> : null}

          {!isInitializing ? renderActivitiesContent() : null}

          {!isInitializing ? (
            <HomeOrganizerCta onPress={() => router.push('/bli-arrangor' as Href)} />
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  authLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.six,
  },
  pageBody: {
    alignSelf: 'center',
    width: '100%',
    paddingTop: Spacing.five,
  },
  loadingState: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.six,
  },
  browseSection: {
    gap: Spacing.four,
  },
  browseHeader: {
    gap: Spacing.two,
  },
  filterBar: {
    gap: Spacing.two,
  },
  resultsHeader: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
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
