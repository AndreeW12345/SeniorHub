import { type ChangeEvent } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type DateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
};

export function DateTimeField({ label, mode, value, onChange, error }: DateTimeFieldProps) {
  const theme = useTheme();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>

      <input
        type={mode === 'date' ? 'date' : 'time'}
        value={value}
        onChange={handleChange}
        aria-label={label}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          minHeight: 60,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: error ? theme.favorite : theme.border,
          backgroundColor: theme.card,
          color: theme.text,
          fontSize: 20,
          lineHeight: '28px',
          fontWeight: 500,
          paddingLeft: Spacing.four,
          paddingRight: Spacing.four,
          paddingTop: Spacing.three + 2,
          paddingBottom: Spacing.three + 2,
          boxShadow: '0 10px 40px rgba(0, 78, 135, 0.07)',
          outlineColor: theme.primary,
        }}
      />

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
});
