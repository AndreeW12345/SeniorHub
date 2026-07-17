import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import * as Linking from 'expo-linking';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityMembershipActions } from '@/components/activity-membership-actions';
import { ActivityParticipationHelper } from '@/components/activity-participation-helper';
import { ActivityRegistrationButton } from '@/components/activity-registration-button';
import { ActivityRegistrationStatus } from '@/components/activity-registration-status';
import { ActivityDetailRow } from '@/components/activity-detail-row';
import { ActivityImage } from '@/components/activity-image';
import { FavoriteButton } from '@/components/favorite-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getActivityDisplayLocation, getActivityMapsLocation, getGoogleMapsUrl } from '@/constants/activities';
import { getOrganizerPath } from '@/constants/organizers';
import { CardShadow, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useActivitySeatAvailability } from '@/hooks/use-activity-seat-availability';
import { useResponsive } from '@/hooks/use-responsive';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';
import { addActivityToCalendar } from '@/services/calendar';
import { formatDateDisplay, formatTimeDisplay } from '@/utils/date-time-format';
import { showErrorAlert, showSuccessAlert } from '@/utils/confirm-alert';
import { getActivityRegistrationSectionTitle, shouldShowActivityRegistrationSection } from '@/utils/activity-registration';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBack = useSafeBack();
  const { getActivityById } = useActivities();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentWidth, isDesktop } = useResponsive();
  const activity = typeof id === 'string' ? getActivityById(id) : undefined;
  const { bookedCount, refresh: refreshSeatAvailability } = useActivitySeatAvailability(activity);
  const detailImageHeight = isDesktop ? 380 : 300;
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

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

  const displayLocation = getActivityDisplayLocation(activity);

  const openMaps = () => {
    void Linking.openURL(getGoogleMapsUrl(getActivityMapsLocation(activity)));
  };

  const openOrganizer = () => {
    router.push(getOrganizerPath(activity.organizer) as Href);
  };

  const handleAddToCalendar = async () => {
    if (isAddingToCalendar) {
      return;
    }

    setIsAddingToCalendar(true);

    try {
      const result = await addActivityToCalendar(activity);

      if (result.ok) {
        if (result.method === 'ics-download') {
          showSuccessAlert(
            'Kalenderfil skapad',
            'Kalenderfilen har laddats ner. Öppna den för att lägga till aktiviteten i din kalender.',
          );
        } else {
          showSuccessAlert(
            'Tillagd i kalendern',
            'Aktiviteten har lagts till i din kalender.',
          );
        }
        return;
      }

      showErrorAlert('Kunde inte lägga till', result.errorMessage);
    } finally {
      setIsAddingToCalendar(false);
    }
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
                value={formatDateDisplay(activity.date)}
              />
              <ActivityDetailRow
                icon={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
                label="Tid"
                value={formatTimeDisplay(activity.time)}
              />
              <ActivityDetailRow
                icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
                label="Plats"
                value={displayLocation}
              />
              <ActivityDetailRow
                icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
                label="Arrangör"
                value={activity.organizer}
                onPress={openOrganizer}
              />
              {shouldShowActivityRegistrationSection(activity) ? (
                <View style={[styles.registrationBlock, { backgroundColor: theme.primaryLight }]}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    {getActivityRegistrationSectionTitle(activity)}
                  </ThemedText>
                  <ActivityRegistrationStatus
                    activity={activity}
                    variant="detail"
                    bookedCount={bookedCount}
                  />
                  <ActivityParticipationHelper activity={activity} />
                </View>
              ) : null}
            </View>
          </View>

          <ActivityMembershipActions activity={activity} />
          <ActivityRegistrationButton
            activity={activity}
            bookedCount={bookedCount}
            onRegistrationComplete={refreshSeatAvailability}
          />

          <Pressable
            onPress={openMaps}
            accessibilityRole="button"
            accessibilityLabel={`Öppna ${displayLocation} i Google Maps`}
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

          <Pressable
            onPress={() => void handleAddToCalendar()}
            accessibilityRole="button"
            accessibilityLabel="Lägg till i min kalender"
            disabled={isAddingToCalendar}
            style={({ pressed }) => [
              styles.calendarButton,
              { backgroundColor: theme.card, borderColor: theme.primary },
              (pressed || isAddingToCalendar) && styles.calendarButtonPressed,
            ]}>
            <ThemedText type="bodyLarge" themeColor="primary" style={styles.calendarButtonText}>
              📅 Lägg till i min kalender
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
  registrationBlock: {
    gap: Spacing.two,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
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
  calendarButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginBottom: Spacing.two,
  },
  calendarButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  calendarButtonText: {
    fontWeight: '700',
    textAlign: 'center',
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
