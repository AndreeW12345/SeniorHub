import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { AdminFormSection } from '@/components/admin-form-section';
import { AdminGuard } from '@/components/admin-guard';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useOrganizations } from '@/contexts/organizations-context';
import { useTheme } from '@/hooks/use-theme';
import {
  fetchOrganizationByIdFromFirestore,
  saveOrganizationToFirestore,
  uploadOrganizationLogo,
} from '@/services/organizations';

export default function AdminOrganizationScreen() {
  return (
    <AdminGuard>
      <AdminOrganizationScreenContent />
    </AdminGuard>
  );
}

function AdminOrganizationScreenContent() {
  const theme = useTheme();
  const { adminAccount } = useAuth();
  const { refreshOrganizations } = useOrganizations();
  const organizationId = adminAccount?.organizationId?.trim() ?? '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [membershipUrl, setMembershipUrl] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [localLogoUri, setLocalLogoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrganization() {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const organization = await fetchOrganizationByIdFromFirestore(organizationId);
        if (!isMounted || !organization) {
          return;
        }

        setName(organization.name);
        setDescription(organization.description ?? '');
        setWebsite(organization.website ?? '');
        setMembershipUrl(organization.membershipUrl ?? '');
        setEmail(organization.email ?? '');
        setPhone(organization.phone ?? '');
        setCity(organization.city ?? '');
        setLogoUrl(organization.logoUrl ?? '');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrganization();

    return () => {
      isMounted = false;
    };
  }, [organizationId]);

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSubmitError('Ge SeniorHub tillgång till bilder för att välja logotyp.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setLocalLogoUri(result.assets[0].uri);
      setSubmitError(null);
    }
  };

  const handleSave = async () => {
    setSubmitError(null);
    setSuccessMessage(null);

    if (!organizationId) {
      setSubmitError('Ditt adminkonto saknar organisationskoppling.');
      return;
    }

    if (!name.trim()) {
      setSubmitError('Ange organisationsnamn.');
      return;
    }

    setIsSaving(true);
    let nextLogoUrl = logoUrl.trim();

    if (localLogoUri) {
      setIsUploadingLogo(true);
      const uploadResult = await uploadOrganizationLogo(localLogoUri, organizationId);
      setIsUploadingLogo(false);

      if (!uploadResult.ok) {
        setIsSaving(false);
        setSubmitError(uploadResult.errorMessage);
        return;
      }

      nextLogoUrl = uploadResult.downloadUrl;
      setLogoUrl(nextLogoUrl);
      setLocalLogoUri(null);
    }

    const result = await saveOrganizationToFirestore(organizationId, {
      name,
      description,
      website,
      membershipUrl,
      email,
      phone,
      city,
      logoUrl: nextLogoUrl,
    });

    setIsSaving(false);

    if (!result.ok) {
      setSubmitError(result.errorMessage);
      return;
    }

    await refreshOrganizations();
    setSuccessMessage('Organisationsprofilen sparades.');
  };

  const isBusy = isSaving || isUploadingLogo;
  const previewUri = localLogoUri || logoUrl;

  if (isLoading) {
    return (
      <ScreenLayout title="Organisationsprofil" subtitle="Hämtar organisation" showBackButton>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Organisationsprofil"
      subtitle="Det här ser deltagarna när de öppnar er organisation"
      showBackButton
      omitTabInset
      footer={
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
          {successMessage ? (
            <View
              style={[
                styles.banner,
                CardShadow,
                { backgroundColor: theme.primaryLight, borderColor: theme.primary },
              ]}>
              <ThemedText type="bodyLarge" themeColor="primary" style={styles.bannerText}>
                {successMessage}
              </ThemedText>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Spara organisationsprofil"
            disabled={isBusy}
            onPress={() => void handleSave()}
            style={({ pressed }) => [
              styles.saveButton,
              CardShadow,
              { backgroundColor: theme.primary },
              (pressed || isBusy) && styles.pressed,
              isBusy && styles.disabled,
            ]}>
            {isBusy ? (
              <View style={styles.saveBusyRow}>
                <ActivityIndicator color="#FFFFFF" />
                <ThemedText type="bodyLarge" style={styles.saveButtonText}>
                  {isUploadingLogo ? 'Laddar upp logotyp...' : 'Sparar...'}
                </ThemedText>
              </View>
            ) : (
              <ThemedText type="bodyLarge" style={styles.saveButtonText}>
                Spara profil
              </ThemedText>
            )}
          </Pressable>
        </>
      }>
      <View style={styles.form}>
        <AdminFormSection
          title="Grunduppgifter"
          description="Namn, beskrivning och ort som syns på organisationssidan.">
          <FormField
            label="Organisationsnamn *"
            value={name}
            onChangeText={setName}
            placeholder="Till exempel SPF Tyresö"
            editable={!isBusy}
          />
          <FormField
            label="Beskrivning"
            value={description}
            onChangeText={setDescription}
            placeholder="Berätta kort om organisationen"
            multiline
            editable={!isBusy}
          />
          <FormField
            label="Ort / stad"
            value={city}
            onChangeText={setCity}
            placeholder="Till exempel Tyresö"
            editable={!isBusy}
          />
        </AdminFormSection>

        <AdminFormSection title="Logotyp" description="En tydlig logotyp gör er sida lättare att känna igen.">
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.logoPreview} accessibilityLabel="Logotyp" />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: theme.primaryLight }]}>
              <ThemedText type="bodyLarge" themeColor="primary">
                Ingen logotyp ännu
              </ThemedText>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Välj logotyp"
            disabled={isBusy}
            onPress={() => void pickLogo()}
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" themeColor="primary" style={styles.secondaryButtonText}>
              Välj logotyp
            </ThemedText>
          </Pressable>
        </AdminFormSection>

        <AdminFormSection
          title="Kontakt och länkar"
          description="Hemside- och medlemslänkar används på organisationssidan och vid medlemskap.">
          <FormField
            label="Hemsida"
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.se"
            keyboardType="url"
            autoCapitalize="none"
            editable={!isBusy}
          />
          <FormField
            label="Medlemslänk"
            value={membershipUrl}
            onChangeText={setMembershipUrl}
            placeholder="https://example.se/bli-medlem"
            keyboardType="url"
            autoCapitalize="none"
            editable={!isBusy}
          />
          <FormField
            label="E-post"
            value={email}
            onChangeText={setEmail}
            placeholder="info@example.se"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isBusy}
          />
          <FormField
            label="Telefon"
            value={phone}
            onChangeText={setPhone}
            placeholder="08-123 45 67"
            keyboardType="phone-pad"
            editable={!isBusy}
          />
        </AdminFormSection>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.five,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: Radius.xl,
    alignSelf: 'center',
  },
  logoPlaceholder: {
    minHeight: 120,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: Radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  banner: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
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
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.8,
  },
});
