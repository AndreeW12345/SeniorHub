import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, style, ...inputProps }: FormFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        {...inputProps}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          CardShadow,
          {
            backgroundColor: theme.card,
            color: theme.text,
            borderColor: error ? theme.favorite : theme.border,
          },
          inputProps.multiline && styles.multiline,
          style,
        ]}
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
  input: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
    minHeight: 60,
  },
  multiline: {
    minHeight: 140,
    paddingTop: Spacing.three + 2,
    textAlignVertical: 'top',
  },
});
