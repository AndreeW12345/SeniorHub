import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityDetailRow } from '@/components/activity-detail-row';
import { ActivityImage } from '@/components/activity-image';
import { FavoriteButton } from '@/components/favorite-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getGoogleMapsUrl } from '@/constants/activities';
import { CardShadow, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useResponsive } from '@/hooks/use-responsive';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goBack = useSafeBack();
  const { getActivityById } = useActivities();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentWidth, isDesktop } = useResponsive();
  const activity = typeof id === 'string' ? getActivityById(id) : undefined;
  const detailImageHeight = isDesktop ? 380 : 300;

  if (!activity) {
    return (
      <ThemedView style={[styles.notFound, { paddingTop: insets.top + Spacing.four }]}>
        <ThemedText type="subtitle">Aktiviteten hittades inte</ThemedText>
        <Pressable onPress={goBack} style={styles.backLink}>
          <ThemedText type="linkPrimary">Gå tillbaka</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const openMaps = () => {
    void Linking.openURL(getGoogleMapsUrl(activity.location));
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + Spacing.six,
            maxWidth: contentWidth,
          },
        ]}>
        <View style={[styles.imageSection, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Gå tillbaka"
            style={[styles.backButton, { top: insets.top + Spacing.three }]}>
            <SymbolView
              tintColor={theme.primary}
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={22}
              weight="semibold"
            />
            <ThemedText type="bodyLarge" themeColor="primary">
              Tillbaka
            </ThemedText>
          </Pressable>

          <View style={styles.imageFrame}>
            <ActivityImage activity={activity} height={detailImageHeight} rounded />
            <View style={styles.favoriteOnImage}>
              <FavoriteButton activityId={activity.id} size="large" />
            </View>
          </View>
        </View>

        <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.primaryLight }]}>
            <ThemedText type="smallBold" themeColor="primary">
              {activity.category}
            </ThemedText>
          </View>

          <ThemedText type="title" style={styles.title}>
            {activity.title}
          </ThemedText>

          <View style={[styles.descriptionCard, CardShadow, { backgroundColor: theme.card }]}>
            <ThemedText type="sectionTitle">Om aktiviteten</ThemedText>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.description}>
              {activity.description}
            </ThemedText>
          </View>

          <View style={[styles.detailsCard, CardShadow, { backgroundColor: theme.card }]}>
            <ThemedText type="sectionTitle">Praktisk information</ThemedText>
            <View style={styles.details}>
              <ActivityDetailRow
                icon={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                label="Datum"
                value={activity.date}
              />
              <ActivityDetailRow
                icon={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
                label="Tid"
                value={activity.time}
              />
              <ActivityDetailRow
                icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
                label="Plats"
                value={activity.location}
              />
              <ActivityDetailRow
                icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
                label="Arrangör"
                value={activity.organizer}
              />
            </View>
          </View>

          <Pressable
            onPress={openMaps}
            accessibilityRole="button"
            accessibilityLabel={`Öppna ${activity.location} i Google Maps`}
            style={({ pressed }) => [
              styles.mapsButton,
              { backgroundColor: theme.primary },
              pressed && styles.mapsButtonPressed,
            ]}>
            <SymbolView
              tintColor="#FFFFFF"
              name={{ ios: 'map.fill', android: 'map', web: 'map' }}
              size={24}
            />
            <ThemedText type="bodyLarge" style={styles.mapsButtonText}>
              Öppna i Google Maps
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
  },
  imageSection: {
    position: 'relative',
    marginBottom: Spacing.four,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.four,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  imageFrame: {
    marginHorizontal: Spacing.four,
    position: 'relative',
  },
  favoriteOnImage: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
  },
  body: {
    gap: Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  title: {
    letterSpacing: -0.5,
  },
  descriptionCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  description: {
    lineHeight: 32,
  },
  detailsCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  details: {
    gap: Spacing.four,
  },
  mapsButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
    marginBottom: Spacing.two,
  },
  mapsButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  mapsButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  backLink: {
    padding: Spacing.three,
  },
});
