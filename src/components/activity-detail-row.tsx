import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActivityDetailRowProps = {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
  onPress?: () => void;
};

export function ActivityDetailRow({ icon, label, value, onPress }: ActivityDetailRowProps) {
  const theme = useTheme();

  const content = (
    <>
      <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
        <SymbolView tintColor={theme.primary} name={icon} size={22} weight="medium" />
      </View>
      <View style={styles.detailText}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type={onPress ? 'linkPrimary' : 'bodyLarge'}>{value}</ThemedText>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={`${label}: ${value}`}
        style={({ pressed }) => [styles.detailRow, pressed && styles.detailRowPressed]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.detailRow} accessibilityLabel={`${label}: ${value}`}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  detailRowPressed: {
    opacity: 0.85,
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
