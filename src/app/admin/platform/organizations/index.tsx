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
  const { organizations, isLoading, loadError, refreshOrganizations } = useOrganizations();

  useFocusEffect(
    useCallback(() => {
      void refreshOrganizations();
    }, [refreshOrganizations]),
  );

  const handleRetry = () => {
    void refreshOrganizations();
  };

  const handleCreateOrganization = () => {
    router.push('/admin/platform/create-organization' as Href);
  };

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
      ) : loadError && organizations.length === 0 ? (
        <View style={[styles.messageCard, CardShadow, { backgroundColor: theme.card }]}>
          <ThemedText type="bodyLarge" themeColor="favorite" style={styles.messageText}>
            {loadError}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Försök igen"
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.primaryButton,
              CardShadow,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
              Försök igen
            </ThemedText>
          </Pressable>
        </View>
      ) : organizations.length === 0 ? (
        <View style={[styles.messageCard, CardShadow, { backgroundColor: theme.card }]}>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.messageText}>
            Inga organisationer hittades. Skapa en organisation först.
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skapa organisation"
            onPress={handleCreateOrganization}
            style={({ pressed }) => [
              styles.primaryButton,
              CardShadow,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
              Skapa organisation
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {loadError ? (
            <View
              style={[
                styles.errorBanner,
                CardShadow,
                { backgroundColor: '#FDF2F4', borderColor: theme.favorite },
              ]}>
              <ThemedText type="bodyLarge" themeColor="favorite" style={styles.messageText}>
                {loadError}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Försök igen"
                onPress={handleRetry}
                style={({ pressed }) => [styles.retryLink, pressed && styles.pressed]}>
                <ThemedText type="linkPrimary">Försök igen</ThemedText>
              </Pressable>
            </View>
          ) : null}
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
  messageCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  messageText: {
    textAlign: 'center',
    lineHeight: 28,
  },
  errorBanner: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  retryLink: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.9,
  },
});
