import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityCard } from '@/components/activity-card';
import { ActivityList, ActivityListItem } from '@/components/activity-list';
import { ThemedText } from '@/components/themed-text';
import type { Activity } from '@/constants/activities';
import { Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';

type HomeUpcomingSectionProps = {
  activities: Activity[];
  onShowAllPress: () => void;
  /** Use responsive two-column grid for activity cards. */
  useGridLayout?: boolean;
};

export function HomeUpcomingSection({
  activities,
  onShowAllPress,
  useGridLayout = false,
}: HomeUpcomingSectionProps) {
  const { isCompact } = useResponsive();
  const gridColumns = isCompact ? 1 : 2;

  if (activities.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <ThemedText type="sectionTitle" accessibilityRole="header">
          Kommande aktiviteter
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Visa alla aktiviteter"
          onPress={onShowAllPress}
          style={({ pressed }) => [styles.showAllButton, pressed && styles.showAllPressed]}>
          <ThemedText type="linkPrimary" style={styles.showAllText}>
            Visa alla
          </ThemedText>
        </Pressable>
      </View>

      {useGridLayout ? (
        <ActivityList columns={gridColumns} gap={Spacing.three}>
          {activities.map((activity) => (
            <ActivityListItem key={`upcoming-${activity.id}`}>
              <ActivityCard activity={activity} />
            </ActivityListItem>
          ))}
        </ActivityList>
      ) : (
        <View style={styles.list}>
          {activities.map((activity) => (
            <ActivityCard key={`upcoming-${activity.id}`} activity={activity} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  showAllButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  showAllPressed: {
    opacity: 0.75,
  },
  showAllText: {
    fontWeight: '700',
  },
  list: {
    gap: Spacing.three,
  },
});
