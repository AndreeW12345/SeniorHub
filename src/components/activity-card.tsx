import { useRouter, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityDetailRow } from '@/components/activity-detail-row';
import { ActivityImage } from '@/components/activity-image';
import { FavoriteButton } from '@/components/favorite-button';
import { ThemedText } from '@/components/themed-text';
import { Activity } from '@/constants/activities';
import { getCategoryVisual } from '@/constants/category-visuals';
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
    gap: Spacing.four,
  },
});
