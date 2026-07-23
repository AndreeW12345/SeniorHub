import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProfileSectionProps = {
  title: string;
  children: ReactNode;
};

/** Card section with a clear heading for the profile screen. */
export function ProfileSection({ title, children }: ProfileSectionProps) {
  const theme = useTheme();

  return (
    <View style={[styles.section, CardShadow, { backgroundColor: theme.card }]}>
      <ThemedText type="sectionTitle" style={styles.title}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  title: {
    letterSpacing: -0.2,
  },
});
