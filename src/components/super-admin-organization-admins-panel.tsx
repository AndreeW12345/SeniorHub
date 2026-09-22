import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { AdminFormSection } from '@/components/admin-form-section';
import { FormField } from '@/components/form-field';
import { ThemedText } from '@/components/themed-text';
import type { OrganizationAdminListItem } from '@/constants/organization-admin-list';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { inviteOrganizerAdminViaCallable } from '@/services/super-admin/invite-organizer-admin';
import { listOrganizationAdminsViaCallable } from '@/services/super-admin/list-organization-admins';
import {
  validateInviteOrganizerForm,
  type InviteOrganizerFormErrors,
} from '@/utils/organization-id-validation';

type SuperAdminOrganizationAdminsPanelProps = {
  /** Locked Firestore organization id from SuperAdmin route. */
  organizationId: string;
};

export function SuperAdminOrganizationAdminsPanel({
  organizationId,
}: SuperAdminOrganizationAdminsPanelProps) {
  const theme = useTheme();
  const trimmedOrganizationId = organizationId.trim();

  const [admins, setAdmins] = useState<OrganizationAdminListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteErrors, setInviteErrors] = useState<InviteOrganizerFormErrors>({});
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const loadAdmins = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);

    const result = await listOrganizationAdminsViaCallable(trimmedOrganizationId);

    if (!result.ok) {
      setAdmins([]);
      setListError(result.errorMessage);
      setIsLoadingList(false);
      return;
    }

    setAdmins(result.admins);
    setIsLoadingList(false);
  }, [trimmedOrganizationId]);

  useFocusEffect(
    useCallback(() => {
      void loadAdmins();
    }, [loadAdmins]),
  );

  const handleInvite = async () => {
    const nextErrors = validateInviteOrganizerForm(inviteEmail);
    setInviteErrors(nextErrors);
    setInviteError(null);
    setInviteSuccess(null);

    if (nextErrors.email) {
      return;
    }

    setIsInviting(true);

    try {
      const result = await inviteOrganizerAdminViaCallable({
        lockedOrganizationId: trimmedOrganizationId,
        email: inviteEmail,
        displayName: inviteDisplayName,
      });

      if (!result.ok) {
        setInviteError(result.errorMessage);
        return;
      }

      setInviteSuccess(
        result.invite.alreadyAdmin
          ? 'Personen var redan administratör. En ny inbjudan skickades.'
          : 'Inbjudan skickades. Personen får e-post för att välja lösenord.',
      );
      setInviteEmail('');
      setInviteDisplayName('');
      setInviteErrors({});
      await loadAdmins();
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminFormSection
        title="Administratörer"
        description={`Organisation: ${trimmedOrganizationId}. Endast administratörer med roll admin listas här.`}>
        {isLoadingList ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.primary} />
            <ThemedText type="bodyLarge" themeColor="textSecondary">
              Hämtar administratörer...
            </ThemedText>
          </View>
        ) : listError ? (
          <ThemedText type="bodyLarge" themeColor="favorite">
            {listError}
          </ThemedText>
        ) : admins.length === 0 ? (
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Inga administratörer är kopplade till organisationen ännu.
          </ThemedText>
        ) : (
          <View style={styles.list}>
            {admins.map((admin) => (
              <View
                key={admin.uid}
                style={[
                  styles.adminRow,
                  CardShadow,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                <ThemedText type="bodyLarge" style={styles.adminTitle}>
                  {admin.displayName || admin.email || admin.uid}
                </ThemedText>
                {admin.email ? (
                  <ThemedText type="bodyLarge" themeColor="textSecondary">
                    E-post: {admin.email}
                  </ThemedText>
                ) : null}
                <ThemedText type="small" themeColor="textSecondary">
                  Roll: {admin.role} · Organisation: {admin.organizationId}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </AdminFormSection>

      <AdminFormSection
        title="Bjud in administratör"
        description="Skickar e-post med länk för att välja lösenord. Organisationen är låst till den du redigerar.">
        <FormField
          label="Organisations-id"
          value={trimmedOrganizationId}
          onChangeText={() => undefined}
          editable={false}
        />
        <FormField
          label="E-post *"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          error={inviteErrors.email}
          placeholder="admin@example.se"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isInviting}
        />
        <FormField
          label="Visningsnamn"
          value={inviteDisplayName}
          onChangeText={setInviteDisplayName}
          placeholder="Valfritt"
          editable={!isInviting}
        />

        {inviteError ? (
          <ThemedText type="bodyLarge" themeColor="favorite">
            {inviteError}
          </ThemedText>
        ) : null}
        {inviteSuccess ? (
          <ThemedText type="bodyLarge" themeColor="primary">
            {inviteSuccess}
          </ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skicka inbjudan"
          disabled={isInviting}
          onPress={() => void handleInvite()}
          style={({ pressed }) => [
            styles.inviteButton,
            CardShadow,
            { backgroundColor: theme.primary },
            (pressed || isInviting) && styles.pressed,
          ]}>
          {isInviting ? (
            <View style={styles.inviteBusyRow}>
              <ActivityIndicator color="#FFFFFF" />
              <ThemedText type="bodyLarge" style={styles.inviteButtonText}>
                Skickar...
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="bodyLarge" style={styles.inviteButtonText}>
              Skicka inbjudan
            </ThemedText>
          )}
        </Pressable>
      </AdminFormSection>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.five,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  list: {
    gap: Spacing.three,
  },
  adminRow: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  adminTitle: {
    fontWeight: '700',
  },
  inviteButton: {
    minHeight: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  inviteBusyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
