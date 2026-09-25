import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { KeyboardAwareModal } from '@/components/keyboard-aware-modal';
import { OrganizationProfileForm } from '@/components/organization-profile-form';
import { SuperAdminGuard } from '@/components/super-admin-guard';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useOrganizations } from '@/contexts/organizations-context';
import { useTheme } from '@/hooks/use-theme';
import { deleteOrganizationViaCallable } from '@/services/super-admin/delete-organization';
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
  const theme = useTheme();
  const { organizationId: organizationIdParam } = useLocalSearchParams<{
    organizationId: string;
  }>();
  const { refreshOrganizations, getOrganizationById } = useOrganizations();

  const organizationId = resolveSuperAdminOrganizationRouteId(organizationIdParam);
  const organizationName = organizationId
    ? getOrganizationById(organizationId)?.name?.trim() || organizationId
    : '';

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [confirmOrganizationIdInput, setConfirmOrganizationIdInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  if (!organizationId) {
    return (
      <ScreenLayout title="Organisationsprofil" subtitle="Ogiltigt organisations-id" showBackButton>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Organisationen kunde inte öppnas.
        </ThemedText>
      </ScreenLayout>
    );
  }

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalVisible(false);
    setConfirmOrganizationIdInput('');
  };

  const runDeleteOrganization = async () => {
    setDeleteError(null);
    setDeleteSuccess(null);
    setIsDeleting(true);

    try {
      const result = await deleteOrganizationViaCallable({
        lockedOrganizationId: organizationId,
        confirmOrganizationId: confirmOrganizationIdInput,
      });

      if (!result.ok) {
        setDeleteError(result.errorMessage);
        return;
      }

      setDeleteSuccess('Organisationen raderades.');
      setIsDeleteModalVisible(false);
      setConfirmOrganizationIdInput('');
      await refreshOrganizations();
      router.replace('/admin/platform/organizations' as Href);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setDeleteError(null);
    setDeleteSuccess(null);
    setConfirmOrganizationIdInput('');
    setIsDeleteModalVisible(true);
  };

  const confirmMatches =
    confirmOrganizationIdInput.trim().toLowerCase() === organizationId.trim().toLowerCase();

  return (
    <>
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
        bottomContent={
          <View style={styles.deleteSection}>
            {deleteError ? (
              <ThemedText type="bodyLarge" themeColor="favorite" style={styles.deleteMessage}>
                {deleteError}
              </ThemedText>
            ) : null}
            {deleteSuccess ? (
              <ThemedText type="bodyLarge" themeColor="primary" style={styles.deleteMessage}>
                {deleteSuccess}
              </ThemedText>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Radera organisation"
              disabled={isDeleting}
              onPress={handleOpenDeleteModal}
              style={({ pressed }) => [
                styles.deleteButton,
                { borderColor: theme.favorite },
                (pressed || isDeleting) && styles.pressed,
                isDeleting && styles.disabled,
              ]}>
              {isDeleting ? (
                <View style={styles.deleteBusyRow}>
                  <ActivityIndicator color={theme.favorite} />
                  <ThemedText type="bodyLarge" themeColor="favorite" style={styles.deleteButtonText}>
                    Raderar...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText type="bodyLarge" themeColor="favorite" style={styles.deleteButtonText}>
                  Radera organisation
                </ThemedText>
              )}
            </Pressable>
          </View>
        }
      />

      <KeyboardAwareModal
        visible={isDeleteModalVisible}
        variant="center"
        animationType="fade"
        onRequestClose={closeDeleteModal}>
        <View style={[styles.modalCard, CardShadow, { backgroundColor: theme.card }]}>
          <ThemedText type="sectionTitle" themeColor="favorite" style={styles.modalTitle}>
            Radera organisation
          </ThemedText>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.modalText}>
            Du håller på att radera {organizationName} (ID: {organizationId}). Alla org-admins,
            aktiviteter och bokningar kopplade till organisationen tas bort från SeniorHub. Detta
            kan inte ångras.
          </ThemedText>
          <FormField
            label={`Skriv ${organizationId} för att bekräfta`}
            value={confirmOrganizationIdInput}
            onChangeText={setConfirmOrganizationIdInput}
            placeholder={organizationId}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isDeleting}
          />
          <View style={styles.modalActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Avbryt radering"
              disabled={isDeleting}
              onPress={closeDeleteModal}
              style={({ pressed }) => [styles.modalSecondaryButton, pressed && styles.pressed]}>
              <ThemedText type="linkPrimary">Avbryt</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bekräfta radering av organisation"
              disabled={isDeleting || !confirmMatches}
              onPress={() => void runDeleteOrganization()}
              style={({ pressed }) => [
                styles.modalPrimaryButton,
                { backgroundColor: theme.favorite },
                (pressed || isDeleting || !confirmMatches) && styles.pressed,
                (isDeleting || !confirmMatches) && styles.disabled,
              ]}>
              {isDeleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText type="bodyLarge" style={styles.modalPrimaryButtonText}>
                  Radera
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAwareModal>
    </>
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
  deleteSection: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  deleteMessage: {
    textAlign: 'center',
    lineHeight: 28,
  },
  deleteButton: {
    minHeight: 56,
    borderRadius: Radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  deleteBusyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  deleteButtonText: {
    fontWeight: '700',
  },
  modalCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  modalTitle: {
    textAlign: 'center',
    fontWeight: '700',
  },
  modalText: {
    textAlign: 'center',
    lineHeight: 28,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  modalSecondaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  modalPrimaryButton: {
    minHeight: 48,
    minWidth: 120,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.7,
  },
});
