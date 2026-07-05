import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActivityDetailRowProps = {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
};

export function ActivityDetailRow({ icon, label, value }: ActivityDetailRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.detailRow} accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
        <SymbolView tintColor={theme.primary} name={icon} size={22} weight="medium" />
      </View>
      <View style={styles.detailText}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="bodyLarge">{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
    gap: 4,
  },
});
