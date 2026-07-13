import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function FormCheckbox({ label, checked, onChange, disabled = false }: FormCheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [
        styles.container,
        CardShadow,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked ? theme.primary : theme.card,
            borderColor: checked ? theme.primary : theme.border,
          },
        ]}>
        {checked ? (
          <SymbolView
            tintColor="#FFFFFF"
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={18}
            weight="bold"
          />
        ) : null}
      </View>
      <ThemedText type="bodyLarge" style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 60,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.6,
  },
  box: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontWeight: '600',
  },
});
