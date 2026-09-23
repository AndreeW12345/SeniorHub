import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { SuperAdminGuard } from '@/components/super-admin-guard';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useOrganizations } from '@/contexts/organizations-context';
import { useTheme } from '@/hooks/use-theme';

export default function SuperAdminOrganizationsScreen() {
  return (
    <SuperAdminGuard>
      <SuperAdminOrganizationsScreenContent />
    </SuperAdminGuard>
  );
}

function SuperAdminOrganizationsScreenContent() {
  const theme = useTheme();
  const router = useRouter();
  const { organizations, isLoading, refreshOrganizations } = useOrganizations();

  useFocusEffect(
    useCallback(() => {
      void refreshOrganizations();
    }, [refreshOrganizations]),
  );

  return (
    <ScreenLayout
      title="Organisationer"
      subtitle="Välj en organisation att redigera"
      showBackButton
      omitTabInset>
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : organizations.length === 0 ? (
        <View style={[styles.emptyCard, CardShadow, { backgroundColor: theme.card }]}>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
            Inga organisationer hittades. Skapa en organisation först.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.list}>
          {organizations.map((organization) => (
            <Pressable
              key={organization.id}
              accessibilityRole="button"
              accessibilityLabel={`Redigera ${organization.name}`}
              onPress={() =>
                router.push(`/admin/platform/organization/${organization.id}` as Href)
              }
              style={({ pressed }) => [
                styles.row,
                CardShadow,
                { backgroundColor: theme.card, borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.rowTitle}>
                {organization.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                ID: {organization.id} · /organizer/{organization.slug}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  list: {
    gap: Spacing.three,
  },
  row: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  rowTitle: {
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.9,
  },
});
