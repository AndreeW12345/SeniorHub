import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/activities';
import { getCategoryVisual } from '@/constants/category-visuals';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CategoryDropdownProps = {
  value: ActivityCategory;
  onChange: (category: ActivityCategory) => void;
  error?: string;
};

export function CategoryDropdown({ value, onChange, error }: CategoryDropdownProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Kategori
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Välj kategori"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((open) => !open)}
        style={({ pressed }) => [
          styles.trigger,
          CardShadow,
          {
            backgroundColor: theme.card,
            borderColor: error ? theme.favorite : theme.border,
          },
          pressed && styles.pressed,
        ]}>
        <View style={styles.valueRow}>
          <View style={[styles.colorDot, { backgroundColor: getCategoryVisual(value).background }]} />
          <ThemedText type="bodyLarge">{value}</ThemedText>
        </View>
        <SymbolView
          tintColor={theme.primary}
          name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow_drop_down' }}
          size={24}
        />
      </Pressable>

      {isOpen ? (
        <View style={[styles.options, CardShadow, { backgroundColor: theme.card }]}>
          {ACTIVITY_CATEGORIES.map((category) => {
            const isSelected = category === value;

            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onChange(category);
                  setIsOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: isSelected ? theme.primaryLight : theme.card,
                  },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.valueRow}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: getCategoryVisual(category).background },
                    ]}
                  />
                  <ThemedText
                    type="bodyLarge"
                    themeColor={isSelected ? 'primary' : 'text'}
                    style={isSelected ? styles.selectedOption : undefined}>
                    {category}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {error ? (
        <ThemedText type="small" themeColor="favorite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  trigger: {
    minHeight: 60,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  options: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
    minHeight: 56,
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: Radius.pill,
  },
  selectedOption: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
