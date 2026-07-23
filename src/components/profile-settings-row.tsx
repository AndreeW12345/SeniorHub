import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProfileSettingsRowProps = {
  title: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Large tappable settings row for the profile screen. */
export function ProfileSettingsRow({
  title,
  icon,
  onPress,
  accessibilityLabel,
}: ProfileSettingsRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
        <SymbolView tintColor={theme.primary} name={icon} size={26} />
      </View>
      <ThemedText type="bodyLarge" style={styles.title}>
        {title}
      </ThemedText>
      <SymbolView
        tintColor={theme.textSecondary}
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={22}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
