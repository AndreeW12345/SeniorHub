import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  ACTIVITY_QUICK_FILTERS,
  ACTIVITY_QUICK_FILTER_LABELS,
  type ActivityQuickFilter,
} from '@/constants/activity-filters';
import { Radius, SoftShadow, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

type ActivityQuickFilterBarProps = {
  selected: readonly ActivityQuickFilter[];
  onToggle: (filter: ActivityQuickFilter) => void;
};

/** Multi-select quick filter chips. Empty selection shows all activities. */
export function ActivityQuickFilterBar({ selected, onToggle }: ActivityQuickFilterBarProps) {
  const theme = useTheme();
  const { isCompact } = useResponsive();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      accessibilityRole="tablist"
      accessibilityLabel="Snabbfilter">
      {ACTIVITY_QUICK_FILTERS.map((filter) => {
        const isSelected = selected.includes(filter);
        const label = ACTIVITY_QUICK_FILTER_LABELS[filter];

        return (
          <Pressable
            key={filter}
            onPress={() => onToggle(filter)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
            style={({ pressed }) => [
              styles.chip,
              !isSelected && SoftShadow,
              {
                backgroundColor: isSelected ? theme.primary : theme.card,
                borderColor: isSelected ? theme.primary : 'transparent',
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText
              type="smallBold"
              style={[
                styles.chipText,
                { color: isSelected ? '#FFFFFF' : theme.text },
                isCompact && styles.chipTextCompact,
              ]}>
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.four + 4,
    paddingVertical: Spacing.three,
    minHeight: 52,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 18,
  },
  chipTextCompact: {
    fontSize: 17,
  },
  pressed: {
    opacity: 0.88,
  },
});
