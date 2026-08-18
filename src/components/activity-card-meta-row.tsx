import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ActivityCardMetaRowProps = {
  icon: string;
  value: string;
  accessibilityPrefix: string;
};

/** Single aligned icon + text row for activity cards (date, time, location, availability). */
export function ActivityCardMetaRow({ icon, value, accessibilityPrefix }: ActivityCardMetaRowProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={`${accessibilityPrefix}: ${value}`}>
      <ThemedText style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
        {icon}
      </ThemedText>
      <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.value}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 36,
  },
  icon: {
    width: 32,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  value: {
    flex: 1,
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
