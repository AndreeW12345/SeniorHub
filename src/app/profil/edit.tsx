import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { ProfileAvatar } from '@/components/profile-avatar';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';
import { getOrCreateDeviceId } from '@/services/notifications';
import { uploadProfileImage } from '@/services/profile';
import { showErrorAlert, showSuccessAlert } from '@/utils/confirm-alert';

function isValidEmail(value: string): boolean {
  if (!value.trim()) {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Edit profile form – saves name, phone, email and photo to Firestore. */
export default function EditProfileScreen() {
  const theme = useTheme();
  const goBack = useSafeBack();
  const { profile, isLoading, updateProfile, deviceId } = useUserProfile();

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile.photoUrl);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setPhone(profile.phone);
    setEmail(profile.email);
    setPhotoUrl(profile.photoUrl);
  }, [profile]);

  const handlePickImage = async () => {
    if (isPickingImage || isSaving) {
      return;
    }

    setIsPickingImage(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showErrorAlert(
          'Behörighet saknas',
          'Tillåt tillgång till bilder för att välja en profilbild.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      setLocalPhotoUri(result.assets[0].uri);
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const nextNameError = trimmedName ? undefined : 'Ange ditt namn.';
    const nextEmailError = isValidEmail(trimmedEmail)
      ? undefined
      : 'Ange en giltig e-postadress.';

    setNameError(nextNameError);
    setEmailError(nextEmailError);

    if (nextNameError || nextEmailError) {
      return;
    }

    setIsSaving(true);

    try {
      let nextPhotoUrl = photoUrl;

      if (localPhotoUri) {
        const id = deviceId ?? (await getOrCreateDeviceId());
        const uploadResult = await uploadProfileImage(localPhotoUri, id);
        if (!uploadResult.ok) {
          showErrorAlert('Kunde inte ladda upp bild', uploadResult.errorMessage);
          return;
        }
        nextPhotoUrl = uploadResult.downloadUrl;
      }

      const result = await updateProfile({
        name: trimmedName,
        phone: phone.trim(),
        email: trimmedEmail,
        photoUrl: nextPhotoUrl,
      });

      if (!result.ok) {
        showErrorAlert('Kunde inte spara', result.errorMessage);
        return;
      }

      showSuccessAlert('Profil sparad', 'Dina uppgifter har uppdaterats.');
      goBack();
    } finally {
      setIsSaving(false);
    }
  };

  const previewUri = localPhotoUri ?? photoUrl;

  return (
    <ScreenLayout
      title="Redigera profil"
      subtitle="Uppdatera dina uppgifter"
      omitTabInset
      footer={
        <View style={styles.footerActions}>
          <Pressable
            onPress={() => void handleSave()}
            accessibilityRole="button"
            accessibilityLabel="Spara profil"
            disabled={isSaving || isLoading}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.primary },
              (pressed || isSaving || isLoading) && styles.pressed,
            ]}>
            {isSaving ? (
              <View style={styles.busyRow}>
                <ActivityIndicator color="#FFFFFF" />
                <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                  Sparar...
                </ThemedText>
              </View>
            ) : (
              <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                Spara ändringar
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Avbryt"
            disabled={isSaving}
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: theme.border, backgroundColor: theme.card },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.secondaryButtonText}>
              Avbryt
            </ThemedText>
          </Pressable>
        </View>
      }>
      <View style={styles.form}>
        <View style={styles.avatarBlock}>
          <ProfileAvatar photoUrl={previewUri} size={128} />
          <Pressable
            onPress={() => void handlePickImage()}
            accessibilityRole="button"
            accessibilityLabel="Byt profilbild"
            disabled={isPickingImage || isSaving}
            style={({ pressed }) => [
              styles.photoButton,
              { borderColor: theme.primary, backgroundColor: theme.card },
              (pressed || isPickingImage) && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" themeColor="primary" style={styles.secondaryButtonText}>
              {isPickingImage ? 'Öppnar bilder...' : 'Byt profilbild'}
            </ThemedText>
          </Pressable>
        </View>

        <FormField
          label="Namn"
          value={name}
          onChangeText={setName}
          error={nameError}
          placeholder="Ditt namn"
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
        />

        <FormField
          label="Telefonnummer"
          value={phone}
          onChangeText={setPhone}
          placeholder="070-123 45 67"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
        />

        <FormField
          label="E-post"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          placeholder="namn@exempel.se"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  photoButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    alignSelf: 'stretch',
  },
  footerActions: {
    gap: Spacing.three,
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.9,
  },
});
