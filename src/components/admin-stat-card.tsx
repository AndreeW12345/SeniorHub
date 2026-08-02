import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AdminStatCardProps = {
  label: string;
  value: string;
};

/** Large-number KPI card for the admin statistics screen. */
export function AdminStatCard({ label, value }: AdminStatCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.card, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}>
      <ThemedText type="title" style={styles.value} themeColor="primary">
        {value}
      </ThemedText>
      <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.five,
    gap: Spacing.two,
    minWidth: 140,
    flexGrow: 1,
    flexBasis: 160,
  },
  value: {
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  label: {
    fontWeight: '600',
    lineHeight: 28,
  },
});
