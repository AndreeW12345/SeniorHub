import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ORGANIZER_BENEFITS } from '@/constants/become-organizer';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

export function OrganizerBenefitCards() {
  const theme = useTheme();
  const { isTablet, isDesktop } = useResponsive();
  const useTwoColumns = isTablet || isDesktop;

  return (
    <View style={styles.section}>
      <ThemedText type="sectionTitle" accessibilityRole="header">
        Varför bli arrangör?
      </ThemedText>

      <View style={[styles.grid, useTwoColumns && styles.gridTwoColumn]}>
        {ORGANIZER_BENEFITS.map((benefit) => (
          <View
            key={benefit.title}
            style={[
              styles.card,
              CardShadow,
              { backgroundColor: theme.card },
              useTwoColumns && styles.cardHalf,
            ]}>
            <ThemedText style={styles.icon}>{benefit.icon}</ThemedText>
            <ThemedText type="bodyLarge" style={styles.title}>
              {benefit.title}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.four + 4,
  },
  grid: {
    gap: Spacing.four,
  },
  gridTwoColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.three,
    minHeight: 132,
    justifyContent: 'center',
  },
  cardHalf: {
    width: '48%',
    flexGrow: 1,
  },
  icon: {
    fontSize: 36,
    lineHeight: 44,
  },
  title: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '600',
  },
});
