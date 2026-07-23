import { Platform, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type NotificationPreferenceRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

/** Single reminder preference with label, description and switch. */
export function NotificationPreferenceRow({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: NotificationPreferenceRowProps) {
  const theme = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityRole="none"
      accessibilityLabel={`${title}. ${description}`}>
      <View style={styles.textBlock}>
        <ThemedText type="bodyLarge" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.description}>
          {description}
        </ThemedText>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={title}
        accessibilityHint={description}
        trackColor={{
          false: theme.border,
          true: theme.primaryLight,
        }}
        thumbColor={
          Platform.OS === 'android'
            ? value
              ? theme.primary
              : theme.card
            : undefined
        }
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  textBlock: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontWeight: '700',
  },
  description: {
    lineHeight: 30,
  },
});
