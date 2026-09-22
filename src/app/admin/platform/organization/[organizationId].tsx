import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

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
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Hantera administratörer"
        onPress={() =>
          router.push(`/admin/platform/organization/${organizationId}/admins` as Href)
        }
        style={({ pressed }) => [styles.adminLink, pressed && styles.pressed]}>
        <ThemedText type="linkPrimary">Hantera administratörer</ThemedText>
      </Pressable>
      <OrganizationProfileForm
        organizationId={organizationId}
        title="Organisationsprofil"
        subtitle={`Redigerar ${organizationId}`}
        onSaved={() => refreshOrganizations()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: Spacing.two,
  },
  adminLink: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  pressed: {
    opacity: 0.9,
  },
});
