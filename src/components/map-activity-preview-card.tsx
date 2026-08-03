import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getActivityDisplayLocation, type Activity } from '@/constants/activities';
import { getCategoryVisual } from '@/constants/category-visuals';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatAddressDisplay } from '@/utils/address-format';
import { formatDateDisplay, formatTimeDisplay } from '@/utils/date-time-format';

type MapActivityPreviewCardProps = {
  activity: Activity;
  onViewActivity: () => void;
  onDismiss?: () => void;
};

function getShortMapAddress(activity: Activity): string {
  const street = activity.street?.trim();
  const city = activity.city?.trim();
  if (street && city) {
    return `${street}, ${city}`;
  }
  if (street) {
    return street;
  }
  return formatAddressDisplay(getActivityDisplayLocation(activity));
}

/** Preview card shown when a map marker (or web list item) is selected. */
export function MapActivityPreviewCard({
  activity,
  onViewActivity,
  onDismiss,
}: MapActivityPreviewCardProps) {
  const theme = useTheme();
  const categoryVisual = getCategoryVisual(activity.category);
  const address = getShortMapAddress(activity);

  return (
    <View
      style={[styles.card, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}
      accessibilityLabel={`${activity.title}. ${activity.category}. ${formatDateDisplay(activity.date)}. ${formatTimeDisplay(activity.time)}. ${activity.organizer}. ${address}.`}>
      <View style={styles.headerRow}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryVisual.background }]}>
          <ThemedText type="smallBold" style={{ color: categoryVisual.foreground }}>
            {activity.category}
          </ThemedText>
        </View>

        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stäng"
            onPress={onDismiss}
            style={({ pressed }) => [styles.dismissButton, pressed && styles.pressed]}>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.dismissText}>
              Stäng
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <ThemedText type="cardTitle" style={styles.title}>
        {activity.title}
      </ThemedText>

      <View style={styles.meta}>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {formatDateDisplay(activity.date)}
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {formatTimeDisplay(activity.time)}
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {activity.organizer}
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {address}
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Visa aktivitet ${activity.title}`}
        onPress={onViewActivity}
        style={({ pressed }) => [
          styles.viewButton,
          { backgroundColor: theme.primary },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="bodyLarge" style={styles.viewButtonText}>
          Visa aktivitet
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  dismissButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  dismissText: {
    fontWeight: '600',
  },
  title: {
    letterSpacing: -0.3,
  },
  meta: {
    gap: Spacing.one,
  },
  viewButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.one,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
