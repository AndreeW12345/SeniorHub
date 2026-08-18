import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityCardAvailability } from '@/components/activity-card-availability';
import { ActivityCardMetaRow } from '@/components/activity-card-meta-row';
import { ActivitySchedule } from '@/components/activity-schedule';
import { ThemedText } from '@/components/themed-text';
import { getActivityPlaceName, type Activity } from '@/constants/activities';
import { getCategoryEmoji, getCategoryVisual } from '@/constants/category-visuals';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MapActivityPreviewCardProps = {
  activity: Activity;
  onViewActivity: () => void;
  onDismiss?: () => void;
};

/** Preview card shown when a map marker (or web list item) is selected. */
export function MapActivityPreviewCard({
  activity,
  onViewActivity,
  onDismiss,
}: MapActivityPreviewCardProps) {
  const theme = useTheme();
  const categoryVisual = getCategoryVisual(activity.category);
  const categoryEmoji = getCategoryEmoji(activity.category);
  const placeName = getActivityPlaceName(activity);

  return (
    <View
      style={[styles.card, CardShadow, { backgroundColor: theme.card }]}
      accessibilityLabel={`${activity.title}. ${activity.category}. ${placeName}.`}>
      <View style={styles.headerRow}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryVisual.tint }]}>
          <ThemedText style={styles.categoryEmoji}>{categoryEmoji}</ThemedText>
          <ThemedText
            type="smallBold"
            style={[styles.categoryLabel, { color: categoryVisual.background }]}>
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

      <View style={styles.metaGroup}>
        <ActivitySchedule date={activity.date} time={activity.time} />
        <ActivityCardMetaRow icon="📍" value={placeName} accessibilityPrefix="Plats" />
        <ActivityCardAvailability activity={activity} />
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
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five + 4,
    gap: Spacing.four + 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  categoryBadge: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two,
  },
  categoryEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  categoryLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dismissButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  dismissText: {
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  metaGroup: {
    gap: Spacing.three + 4,
  },
  viewButton: {
    minHeight: 60,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.one,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.9,
  },
});
