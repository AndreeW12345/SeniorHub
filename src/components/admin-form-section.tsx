import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AdminFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/** Card-style section used to group related fields in the admin activity form. */
export function AdminFormSection({ title, description, children }: AdminFormSectionProps) {
  const theme = useTheme();

  return (
    <View style={[styles.section, CardShadow, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <ThemedText type="sectionTitle" style={styles.title}>
          {title}
        </ThemedText>
        {description ? (
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.description}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    letterSpacing: -0.2,
  },
  description: {
    lineHeight: 30,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  body: {
    gap: Spacing.four,
  },
});
