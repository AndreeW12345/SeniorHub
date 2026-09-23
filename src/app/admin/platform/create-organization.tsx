import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AdminFormSection } from '@/components/admin-form-section';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { SuperAdminGuard } from '@/components/super-admin-guard';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useOrganizations } from '@/contexts/organizations-context';
import { useTheme } from '@/hooks/use-theme';
import { createOrganizationViaCallable } from '@/services/super-admin/create-organization';
import {
  hasCreateOrganizationFormErrors,
  validateCreateOrganizationForm,
  type CreateOrganizationFormErrors,
} from '@/utils/organization-id-validation';

export default function SuperAdminCreateOrganizationScreen() {
  return (
    <SuperAdminGuard>
      <SuperAdminCreateOrganizationScreenContent />
    </SuperAdminGuard>
  );
}

function SuperAdminCreateOrganizationScreenContent() {
  const theme = useTheme();
  const router = useRouter();
  const { refreshOrganizations } = useOrganizations();

  const [organizationId, setOrganizationId] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<CreateOrganizationFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [createdOrganizationId, setCreatedOrganizationId] = useState<string | null>(null);
  const [createdOrganizationName, setCreatedOrganizationName] = useState<string | null>(null);
  const [createdOrganizationSlug, setCreatedOrganizationSlug] = useState<string | null>(null);

  const isSuccess = createdOrganizationId !== null;

  const handleSubmit = async () => {
    const nextErrors = validateCreateOrganizationForm({ organizationId, name });
    setErrors(nextErrors);
    setSubmitError(null);

    if (hasCreateOrganizationFormErrors(nextErrors)) {
      setSubmitError('Kontrollera de markerade fälten och försök igen.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await createOrganizationViaCallable({ organizationId, name });

      if (!result.ok) {
        setSubmitError(result.errorMessage);
        return;
      }

      setCreatedOrganizationId(result.organization.organizationId);
      setCreatedOrganizationName(result.organization.name);
      setCreatedOrganizationSlug(result.organization.slug);
      setOrganizationId('');
      setName('');
      setErrors({});
      await refreshOrganizations();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenLayout
      title="Skapa organisation"
      subtitle={
        isSuccess
          ? 'Organisationen är skapad'
          : 'Steg 1 – grunduppgifter för en ny förening'
      }
      showBackButton
      omitTabInset
      scrollable={!isSuccess}
      contentStyle={isSuccess ? styles.successContent : undefined}
      footer={
        isSuccess ? undefined : (
          <>
            {submitError ? (
              <View
                style={[
                  styles.banner,
                  CardShadow,
                  { backgroundColor: '#FDF2F4', borderColor: theme.favorite },
                ]}>
                <ThemedText type="bodyLarge" themeColor="favorite" style={styles.bannerText}>
                  {submitError}
                </ThemedText>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skapa organisation"
              disabled={isSaving}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => [
                styles.saveButton,
                CardShadow,
                { backgroundColor: theme.primary },
                (pressed || isSaving) && styles.pressed,
                isSaving && styles.disabled,
              ]}>
              {isSaving ? (
                <View style={styles.saveBusyRow}>
                  <ActivityIndicator color="#FFFFFF" />
                  <ThemedText type="bodyLarge" style={styles.saveButtonText}>
                    Skapar...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText type="bodyLarge" style={styles.saveButtonText}>
                  Skapa organisation
                </ThemedText>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tillbaka till SeniorHub-administration"
              onPress={() => router.replace('/admin/platform' as Href)}
              style={({ pressed }) => [styles.secondaryLink, pressed && styles.pressed]}>
              <ThemedText type="linkPrimary">Tillbaka till SeniorHub-administration</ThemedText>
            </Pressable>
          </>
        )
      }>
      {isSuccess ? (
        <View style={styles.successRoot}>
          <View
            style={[
              styles.successCard,
              CardShadow,
              { backgroundColor: theme.primaryLight, borderColor: theme.primary },
            ]}>
            <ThemedText type="sectionTitle" themeColor="primary" style={styles.successTitle}>
              Organisationen skapades
            </ThemedText>
            <ThemedText type="bodyLarge" themeColor="primary" style={styles.bannerText}>
              ID: {createdOrganizationId}
            </ThemedText>
            {createdOrganizationName ? (
              <ThemedText type="bodyLarge" themeColor="primary" style={styles.bannerText}>
                Namn: {createdOrganizationName}
              </ThemedText>
            ) : null}
            {createdOrganizationSlug ? (
              <ThemedText type="bodyLarge" themeColor="primary" style={styles.bannerText}>
                Publik slug: {createdOrganizationSlug}
              </ThemedText>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tillbaka till organisationer"
              onPress={() => router.replace('/admin/platform/organizations' as Href)}
              style={({ pressed }) => [
                styles.saveButton,
                CardShadow,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.saveButtonText}>
                Tillbaka till organisationer
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.form}>
          <AdminFormSection
            title="Grunduppgifter"
            description="Organisations-id används internt. Namnet visas publikt och styr slug för organisationssidan.">
            <FormField
              label="Organisations-id *"
              value={organizationId}
              onChangeText={setOrganizationId}
              error={errors.organizationId}
              placeholder="spf-tyreso"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
            />
            <FormField
              label="Organisationsnamn *"
              value={name}
              onChangeText={setName}
              error={errors.name}
              placeholder="Till exempel SPF Tyresö"
              editable={!isSaving}
            />
          </AdminFormSection>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.five,
  },
  successContent: {
    flex: 1,
    paddingTop: Spacing.three,
  },
  successRoot: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  successCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.six,
    gap: Spacing.four,
    width: '100%',
  },
  successTitle: {
    textAlign: 'center',
    fontWeight: '700',
  },
  banner: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  bannerText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    minHeight: 68,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  saveBusyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.8,
  },
});
