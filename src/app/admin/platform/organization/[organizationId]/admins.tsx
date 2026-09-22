import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SuperAdminOrganizationAdminsPanel } from '@/components/super-admin-organization-admins-panel';
import { SuperAdminGuard } from '@/components/super-admin-guard';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { resolveSuperAdminOrganizationRouteId } from '@/utils/organization-id-validation';

export default function SuperAdminOrganizationAdminsScreen() {
  return (
    <SuperAdminGuard>
      <SuperAdminOrganizationAdminsScreenContent />
    </SuperAdminGuard>
  );
}

function SuperAdminOrganizationAdminsScreenContent() {
  const router = useRouter();
  const { organizationId: organizationIdParam } = useLocalSearchParams<{
    organizationId: string;
  }>();

  const organizationId = resolveSuperAdminOrganizationRouteId(organizationIdParam);

  if (!organizationId) {
    return (
      <ScreenLayout title="Administratörer" subtitle="Ogiltigt organisations-id" showBackButton>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Organisationen kunde inte öppnas.
        </ThemedText>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Administratörer"
      subtitle={`Organisation ${organizationId}`}
      showBackButton
      omitTabInset>
      <View style={styles.content}>
        <SuperAdminOrganizationAdminsPanel organizationId={organizationId} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tillbaka till organisationsprofil"
          onPress={() =>
            router.replace(`/admin/platform/organization/${organizationId}` as Href)
          }
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
          <ThemedText type="linkPrimary">Till organisationsprofil</ThemedText>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.five,
  },
  linkRow: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.9,
  },
});
