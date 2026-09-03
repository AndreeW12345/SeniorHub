import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CATEGORIES, type Category } from '@/constants/activities';
import { Radius, SoftShadow, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

type CategoryFilterProps = {
  selected: Category;
  onSelect: (category: Category) => void;
};

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const theme = useTheme();
  const { isCompact } = useResponsive();
  const isMobileWeb = Platform.OS === 'web' && isCompact;

  return (
    <View style={isMobileWeb ? styles.scrollViewportMobileWeb : undefined}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={isMobileWeb ? styles.horizontalScrollMobileWeb : undefined}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="tablist">
      {CATEGORIES.map((category) => {
        const isSelected = category === selected;

        return (
          <Pressable
            key={category}
            onPress={() => onSelect(category)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
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
              {category === 'Alla' ? 'Alla kategorier' : category}
            </ThemedText>
          </Pressable>
        );
      })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollViewportMobileWeb: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  horizontalScrollMobileWeb: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
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
