import { useRouter, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityImage } from '@/components/activity-image';
import { ActivitySchedule } from '@/components/activity-schedule';
import { FavoriteButton } from '@/components/favorite-button';
import { ThemedText } from '@/components/themed-text';
import { Activity, getActivityDisplayLocation } from '@/constants/activities';
import { getCategoryVisual } from '@/constants/category-visuals';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

type ActivityCardProps = {
  activity: Activity;
};

function ActivityInfoLine({
  icon,
  value,
  accessibilityPrefix,
}: {
  icon: string;
  value: string;
  accessibilityPrefix: string;
}) {
  return (
    <View style={styles.infoLine} accessibilityLabel={`${accessibilityPrefix}: ${value}`}>
      <ThemedText type="bodyLarge" style={styles.infoIcon}>
        {icon}
      </ThemedText>
      <ThemedText type="bodyLarge" style={styles.infoText}>
        {value}
      </ThemedText>
    </View>
  );
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const { imageHeight } = useResponsive();
  const categoryVisual = getCategoryVisual(activity.category);
  const displayLocation = getActivityDisplayLocation(activity);

  const openActivity = () => {
    router.push(`/activity/${activity.id}` as Href);
  };

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      <View style={styles.imageWrapper}>
        {/* Image area is clickable, but favorite button is a sibling to avoid nested buttons on web. */}
        <Pressable
          onPress={openActivity}
          accessibilityRole="button"
          accessibilityLabel={`Visa aktivitet: ${activity.title}`}
          style={({ pressed }) => [pressed && styles.cardPressed]}>
          <ActivityImage activity={activity} height={imageHeight} />
          <View style={styles.imageBadges}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryVisual.background }]}>
              <SymbolView
                tintColor={categoryVisual.foreground}
                name={categoryVisual.icon}
                size={18}
                weight="semibold"
              />
              <ThemedText
                type="smallBold"
                style={[styles.categoryText, { color: categoryVisual.foreground }]}>
                {activity.category}
              </ThemedText>
            </View>
            <View style={styles.favoriteSpacer} />
          </View>
        </Pressable>

        <View style={styles.favoriteAnchor} pointerEvents="box-none">
          <FavoriteButton activityId={activity.id} />
        </View>
      </View>

      <Pressable
        onPress={openActivity}
        accessibilityRole="button"
        accessibilityLabel={`Visa aktivitet: ${activity.title}`}
        style={({ pressed }) => [pressed && styles.cardPressed]}>
        <View style={styles.content}>
          <ThemedText type="cardTitle" style={styles.cardTitle}>
            {activity.title}
          </ThemedText>

          <ActivitySchedule date={activity.date} time={activity.time} />

          <View style={styles.details}>
            <ActivityInfoLine icon="📍" value={displayLocation} accessibilityPrefix="Plats" />
            <ActivityInfoLine icon="👤" value={activity.organizer} accessibilityPrefix="Arrangör" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardPressed: {
    opacity: 0.96,
  },
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  imageBadges: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    bottom: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two,
  },
  categoryText: {
    color: '#FFFFFF',
  },
  favoriteSpacer: {
    width: 48,
    height: 48,
  },
  favoriteAnchor: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    zIndex: 2,
  },
  content: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five + 4,
    gap: Spacing.four,
  },
  cardTitle: {
    letterSpacing: -0.3,
  },
  details: {
    gap: Spacing.five,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  infoIcon: {
    fontSize: 24,
    lineHeight: 32,
  },
  infoText: {
    flex: 1,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
