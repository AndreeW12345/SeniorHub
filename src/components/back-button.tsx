import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';

type BackButtonProps = {
  style?: StyleProp<ViewStyle>;
};

/** Shared top-left back control for stack/sub pages. */
export function BackButton({ style }: BackButtonProps) {
  const goBack = useSafeBack();
  const theme = useTheme();

  return (
    <Pressable
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel="Gå tillbaka"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}>
      <SymbolView
        tintColor={theme.primary}
        name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
        size={22}
        weight="semibold"
      />
      <ThemedText type="bodyLarge" themeColor="primary">
        Tillbaka
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.88,
  },
});
