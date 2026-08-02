import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  /** Shows the shared top-left back control (stack/sub pages only). */
  showBackButton?: boolean;
};

export function ScreenHeader({
  title,
  subtitle,
  footer,
  showBackButton = false,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, headerPaddingBottom } = useResponsive();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.primary,
          paddingTop: insets.top + Spacing.four,
          paddingHorizontal: horizontalPadding,
          paddingBottom: headerPaddingBottom,
        },
      ]}>
      {showBackButton ? <BackButton /> : null}
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      {subtitle && (
        <ThemedText type="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
  },
  title: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: '#C6DCF0',
    maxWidth: 640,
  },
});
