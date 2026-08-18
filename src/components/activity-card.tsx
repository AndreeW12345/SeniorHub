import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityCardAvailability } from '@/components/activity-card-availability';
import { ActivityCardMetaRow } from '@/components/activity-card-meta-row';
import { ActivityImage } from '@/components/activity-image';
import { ActivitySchedule } from '@/components/activity-schedule';
import { FavoriteButton } from '@/components/favorite-button';
import { ThemedText } from '@/components/themed-text';
import { Activity, getActivityPlaceName } from '@/constants/activities';
import { getCategoryEmoji, getCategoryVisual } from '@/constants/category-visuals';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

type ActivityCardProps = {
  activity: Activity;
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const { imageHeight } = useResponsive();
  const categoryVisual = getCategoryVisual(activity.category);
  const categoryEmoji = getCategoryEmoji(activity.category);
  const placeName = getActivityPlaceName(activity);

  const openActivity = () => {
    router.push(`/activity/${activity.id}` as Href);
  };

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      <View style={styles.imageWrapper}>
        <Pressable
          onPress={openActivity}
          accessibilityRole="button"
          accessibilityLabel={`Visa aktivitet: ${activity.title}`}
          style={({ pressed }) => [pressed && styles.pressed]}>
          <ActivityImage activity={activity} height={imageHeight} />
        </Pressable>

        <View style={styles.favoriteAnchor} pointerEvents="box-none">
          <FavoriteButton activityId={activity.id} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryVisual.tint }]}>
          <ThemedText style={styles.categoryEmoji}>{categoryEmoji}</ThemedText>
          <ThemedText
            type="smallBold"
            style={[styles.categoryLabel, { color: categoryVisual.background }]}>
            {activity.category}
          </ThemedText>
        </View>

        <Pressable
          onPress={openActivity}
          accessibilityRole="button"
          accessibilityLabel={`Visa aktivitet: ${activity.title}`}
          style={({ pressed }) => [styles.detailsPressable, pressed && styles.pressed]}>
          <ThemedText type="cardTitle" style={styles.title}>
            {activity.title}
          </ThemedText>

          <View style={styles.metaGroup}>
            <ActivitySchedule date={activity.date} time={activity.time} />
            <ActivityCardMetaRow icon="📍" value={placeName} accessibilityPrefix="Plats" />
            <ActivityCardAvailability activity={activity} />
          </View>
        </Pressable>

        <Pressable
          onPress={openActivity}
          accessibilityRole="button"
          accessibilityLabel={`Visa aktivitet och boka: ${activity.title}`}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
            Visa aktivitet
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  favoriteAnchor: {
    position: 'absolute',
    top: Spacing.four,
    right: Spacing.four,
    zIndex: 2,
  },
  content: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five + 4,
    gap: Spacing.four + 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
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
  detailsPressable: {
    gap: Spacing.four,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  metaGroup: {
    gap: Spacing.three + 4,
  },
  primaryButton: {
    minHeight: 60,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.one,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
  },
});
