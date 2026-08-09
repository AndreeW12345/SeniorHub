import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

const FEATURES = [
  {
    icon: '🎉',
    title: 'Hitta aktiviteter',
    description: 'Upptäck fika, promenader, bingo och mycket mer.',
  },
  {
    icon: '❤️',
    title: 'Träffa nya människor',
    description: 'Lär känna andra med liknande intressen.',
  },
  {
    icon: '📍',
    title: 'Nära dig',
    description: 'Hitta aktiviteter i ditt närområde.',
  },
] as const;

export function HomeFeatureCards() {
  const theme = useTheme();
  const { isDesktop, isTablet } = useResponsive();

  return (
    <View
      style={[
        styles.grid,
        (isTablet || isDesktop) && styles.gridRow,
      ]}
      accessibilityRole="list">
      {FEATURES.map((feature) => (
        <View
          key={feature.title}
          style={[
            styles.card,
            CardShadow,
            { backgroundColor: theme.card },
            (isTablet || isDesktop) && styles.cardRowItem,
          ]}
          accessibilityRole="text">
          <ThemedText style={styles.icon} accessibilityLabel={feature.title}>
            {feature.icon}
          </ThemedText>
          <ThemedText type="cardTitle" style={styles.title}>
            {feature.title}
          </ThemedText>
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            {feature.description}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.three,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    flex: 1,
  },
  cardRowItem: {
    minWidth: 0,
  },
  icon: {
    fontSize: 36,
    lineHeight: 44,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
});
