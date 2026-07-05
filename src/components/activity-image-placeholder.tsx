import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ActivityCategory } from '@/constants/activities';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CATEGORY_ICONS: Record<ActivityCategory, SymbolViewProps['name']> = {
  Fika: { ios: 'cup.and.saucer.fill', android: 'local_cafe', web: 'local_cafe' },
  Motion: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  Kultur: { ios: 'theatermasks.fill', android: 'theater_comedy', web: 'theater_comedy' },
  Kurser: { ios: 'book.fill', android: 'menu_book', web: 'menu_book' },
  Promenader: { ios: 'leaf.fill', android: 'park', web: 'park' },
};

type ActivityImagePlaceholderProps = {
  category: ActivityCategory;
  height: number;
};

export function ActivityImagePlaceholder({ category, height }: ActivityImagePlaceholderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.placeholder,
        { height, backgroundColor: theme.primaryLight },
      ]}
      accessibilityLabel={`Platshållarbild för kategorin ${category}`}>
      <View style={[styles.decorCircleLarge, { backgroundColor: theme.backgroundSelected }]} />
      <View style={[styles.decorCircleSmall, { backgroundColor: theme.backgroundElement }]} />
      <View style={styles.placeholderContent}>
        <View style={[styles.iconCircle, { backgroundColor: theme.card }]}>
          <SymbolView
            tintColor={theme.primary}
            name={CATEGORY_ICONS[category]}
            size={40}
            weight="medium"
          />
        </View>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.placeholderLabel}>
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
