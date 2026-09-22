import { AdminGuard } from '@/components/admin-guard';
import { OrganizationProfileForm } from '@/components/organization-profile-form';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { useOrganizations } from '@/contexts/organizations-context';

export default function AdminOrganizationScreen() {
  return (
    <AdminGuard>
      <AdminOrganizationScreenContent />
    </AdminGuard>
  );
}

function AdminOrganizationScreenContent() {
  const { adminAccount } = useAuth();
  const { refreshOrganizations } = useOrganizations();
  const organizationId = adminAccount?.organizationId?.trim() ?? '';

  if (!organizationId) {
    return (
      <ScreenLayout
        title="Organisationsprofil"
        subtitle="Organisationskoppling saknas"
        showBackButton
        omitTabInset>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Ditt adminkonto saknar organisationskoppling. Kontakta en superadmin för att koppla
          organizationId i Firestore-samlingen admins.
        </ThemedText>
      </ScreenLayout>
    );
  }

  return (
    <OrganizationProfileForm
      organizationId={organizationId}
      onSaved={() => refreshOrganizations()}
    />
  );
}
