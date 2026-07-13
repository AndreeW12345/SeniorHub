import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormRadioGroupProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function FormRadioGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: FormRadioGroupProps<T>) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={option.label}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                CardShadow,
                {
                  backgroundColor: theme.card,
                  borderColor: selected ? theme.primary : theme.border,
                },
                pressed && !disabled && styles.pressed,
                disabled && styles.disabled,
              ]}>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: selected ? theme.primary : theme.border },
                ]}>
                {selected ? (
                  <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                ) : null}
              </View>
              <ThemedText type="bodyLarge" style={styles.optionLabel}>
                {option.label}
              </ThemedText>
              {selected ? (
                <SymbolView
                  tintColor={theme.primary}
                  name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                  size={22}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    minHeight: 60,
    borderRadius: Radius.lg,
    borderWidth: 2,
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
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: Radius.pill,
  },
  optionLabel: {
    flex: 1,
    fontWeight: '600',
  },
});
