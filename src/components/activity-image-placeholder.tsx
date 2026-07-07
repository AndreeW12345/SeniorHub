import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ActivityCategory } from '@/constants/activities';
import { getCategoryVisual } from '@/constants/category-visuals';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActivityImagePlaceholderProps = {
  category: ActivityCategory;
  height: number;
};

export function ActivityImagePlaceholder({ category, height }: ActivityImagePlaceholderProps) {
  const theme = useTheme();
  const visual = getCategoryVisual(category);

  return (
    <View
      style={[styles.placeholder, { height, backgroundColor: visual.tint }]}
      accessibilityLabel={`Platshållarbild för kategorin ${category}`}>
      <View style={[styles.decorCircleLarge, { backgroundColor: theme.card, opacity: 0.5 }]} />
      <View style={[styles.decorCircleSmall, { backgroundColor: theme.card, opacity: 0.6 }]} />
      <View style={styles.placeholderContent}>
        <View style={[styles.iconCircle, { backgroundColor: visual.background }]}>
          <SymbolView tintColor={visual.foreground} name={visual.icon} size={40} weight="medium" />
        </View>
        <ThemedText type="bodyLarge" style={[styles.placeholderLabel, { color: visual.background }]}>
          {category}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircleLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: Radius.pill,
    top: -60,
    right: -40,
    opacity: 0.7,
  },
  decorCircleSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: Radius.pill,
    bottom: -30,
    left: -20,
    opacity: 0.8,
  },
  placeholderContent: {
    alignItems: 'center',
    gap: Spacing.three,
    zIndex: 1,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLabel: {
    fontWeight: '700',
  },
});
