import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { OrganizationProfileForm } from '@/components/organization-profile-form';
import { SuperAdminGuard } from '@/components/super-admin-guard';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useOrganizations } from '@/contexts/organizations-context';
import { resolveSuperAdminOrganizationRouteId } from '@/utils/organization-id-validation';

export default function SuperAdminOrganizationProfileScreen() {
  return (
    <SuperAdminGuard>
      <SuperAdminOrganizationProfileScreenContent />
    </SuperAdminGuard>
  );
}

function SuperAdminOrganizationProfileScreenContent() {
  const router = useRouter();
  const { organizationId: organizationIdParam } = useLocalSearchParams<{
    organizationId: string;
  }>();
  const { refreshOrganizations } = useOrganizations();

  const organizationId = resolveSuperAdminOrganizationRouteId(organizationIdParam);

  if (!organizationId) {
    return (
      <ScreenLayout title="Organisationsprofil" subtitle="Ogiltigt organisations-id" showBackButton>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Organisationen kunde inte öppnas.
        </ThemedText>
      </ScreenLayout>
    );
  }

  return (
    <OrganizationProfileForm
      organizationId={organizationId}
      title="Organisationsprofil"
      subtitle={`Redigerar ${organizationId}`}
      onSaved={() => refreshOrganizations()}
      topContent={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hantera administratörer"
          onPress={() =>
            router.push(`/admin/platform/organization/${organizationId}/admins` as Href)
          }
          style={({ pressed }) => [styles.adminLink, pressed && styles.pressed]}>
          <ThemedText type="linkPrimary">Hantera administratörer</ThemedText>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  adminLink: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.9,
  },
});
