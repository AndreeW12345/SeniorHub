import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatDateDisplay,
  formatDateValue,
  formatTimeDisplay,
  formatTimeValue,
  parseDateValue,
  parseTimeValue,
} from '@/utils/date-time-format';

type DateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
};

function getInitialDate(mode: 'date' | 'time', value: string): Date {
  const parsed = mode === 'date' ? parseDateValue(value) : parseTimeValue(value);
  return parsed ?? new Date();
}

export function DateTimeField({
  label,
  mode,
  value,
  onChange,
  error,
  placeholder,
}: DateTimeFieldProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const displayText = value
    ? mode === 'date'
      ? formatDateDisplay(value)
      : formatTimeDisplay(value)
    : (placeholder ?? (mode === 'date' ? 'Välj datum' : 'Välj tid'));
  const hasValue = value.length > 0;

  const handleValueChange = (_event: unknown, date: Date) => {
    onChange(mode === 'date' ? formatDateValue(date) : formatTimeValue(date));
    if (Platform.OS === 'android') {
      setIsOpen(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${hasValue ? displayText : 'inte valt'}`}
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((open) => !open)}
        style={({ pressed }) => [
          styles.trigger,
          CardShadow,
          {
            backgroundColor: theme.card,
            borderColor: error ? theme.favorite : theme.border,
          },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="bodyLarge" themeColor={hasValue ? 'text' : 'textSecondary'}>
          {displayText}
        </ThemedText>
        <SymbolView
          tintColor={theme.primary}
          name={
            mode === 'date'
              ? { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }
              : { ios: 'clock.fill', android: 'schedule', web: 'schedule' }
          }
          size={24}
        />
      </Pressable>

      {isOpen ? (
        Platform.OS === 'android' ? (
          <DateTimePicker
            mode={mode}
            value={getInitialDate(mode, value)}
            display="default"
            is24Hour
            accentColor={theme.primary}
            positiveButton={{ label: 'Klar' }}
            negativeButton={{ label: 'Avbryt' }}
            onValueChange={handleValueChange}
            onDismiss={() => setIsOpen(false)}
          />
        ) : (
          <View style={[styles.pickerCard, CardShadow, { backgroundColor: theme.card }]}>
            <DateTimePicker
              mode={mode}
              value={getInitialDate(mode, value)}
              display="spinner"
              accentColor={theme.primary}
              onValueChange={handleValueChange}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Klar"
              onPress={() => setIsOpen(false)}
              style={({ pressed }) => [
                styles.doneButton,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.doneButtonText}>
                Klar
              </ThemedText>
            </Pressable>
          </View>
        )
      ) : null}

      {error ? (
        <ThemedText type="small" themeColor="favorite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  trigger: {
    minHeight: 60,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerCard: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  doneButton: {
    minHeight: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
