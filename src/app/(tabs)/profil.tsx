import { useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ProfileAvatar } from '@/components/profile-avatar';
import { ProfileSection } from '@/components/profile-section';
import { ProfileSettingsRow } from '@/components/profile-settings-row';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructiveAction, showErrorAlert, showSuccessAlert } from '@/utils/confirm-alert';

function displayOrPlaceholder(value: string, placeholder: string) {
  const trimmed = value.trim();
  return trimmed || placeholder;
}

/** Profile tab – personal details, settings shortcuts and account actions. */
export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated, signOut } = useAuth();
  const { profile, isLoading, deleteProfile } = useUserProfile();

  const handleSignOut = () => {
    if (isAuthenticated) {
      confirmDestructiveAction(
        'Logga ut',
        'Vill du logga ut från administratörskontot?',
        'Logga ut',
        () => {
          void (async () => {
            await signOut();
            showSuccessAlert('Utloggad', 'Du har loggats ut.');
            router.replace('/');
          })();
        },
      );
      return;
    }

    confirmDestructiveAction(
      'Logga ut',
      'Du är inte inloggad som administratör. Vill du rensa dina profiluppgifter på den här enheten?',
      'Rensa profil',
      () => {
        void (async () => {
          const result = await deleteProfile();
          if (!result.ok) {
            showErrorAlert('Kunde inte rensa', result.errorMessage);
            return;
          }
          showSuccessAlert('Profil rensad', 'Dina profiluppgifter har tagits bort från enheten.');
        })();
      },
    );
  };

  const handleDeleteAccount = () => {
    confirmDestructiveAction(
      'Ta bort konto',
      'Detta tar bort dina sparade profiluppgifter (namn, telefon, e-post och bild). Åtgärden kan inte ångras.',
      'Ta bort konto',
      () => {
        void (async () => {
          const result = await deleteProfile();
          if (!result.ok) {
            showErrorAlert('Kunde inte ta bort', result.errorMessage);
            return;
          }

          if (isAuthenticated) {
            await signOut();
          }

          showSuccessAlert('Konto borttaget', 'Dina profiluppgifter har tagits bort.');
          router.replace('/');
        })();
      },
    );
  };

  return (
    <ScreenLayout title="Profil" subtitle="Dina uppgifter och inställningar">
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Laddar profil...
          </ThemedText>
        </View>
      ) : (
        <>
          <ProfileSection title="Min profil">
            <View style={styles.profileHeader}>
              <ProfileAvatar photoUrl={profile.photoUrl} />
              <View style={styles.profileText}>
                <ThemedText type="sectionTitle" style={styles.name}>
                  {displayOrPlaceholder(profile.name, 'Inget namn ännu')}
                </ThemedText>
                <ThemedText type="bodyLarge" themeColor="textSecondary">
                  {displayOrPlaceholder(profile.phone, 'Inget telefonnummer')}
                </ThemedText>
                <ThemedText type="bodyLarge" themeColor="textSecondary">
                  {displayOrPlaceholder(profile.email, 'Ingen e-postadress')}
                </ThemedText>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/profil/edit' as Href)}
              accessibilityRole="button"
              accessibilityLabel="Redigera profil"
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                Redigera profil
              </ThemedText>
            </Pressable>
          </ProfileSection>

          <ProfileSection title="Inställningar">
            <View style={styles.settingsList}>
              <ProfileSettingsRow
                title="Notiser"
                icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
                onPress={() => router.push('/notiser' as Href)}
              />
              <ProfileSettingsRow
                title="Sekretess"
                icon={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                onPress={() => router.push('/profil/sekretess' as Href)}
              />
              <ProfileSettingsRow
                title="Hjälp & Support"
                icon={{ ios: 'questionmark.circle.fill', android: 'help', web: 'help' }}
                onPress={() => router.push('/profil/hjalp' as Href)}
              />
              <ProfileSettingsRow
                title="Om SeniorHub"
                icon={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
                onPress={() => router.push('/profil/om' as Href)}
              />
            </View>
          </ProfileSection>

          <ProfileSection title="Konto">
            <Pressable
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Logga ut"
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.primary, backgroundColor: theme.card },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" themeColor="primary" style={styles.secondaryButtonText}>
                Logga ut
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleDeleteAccount}
              accessibilityRole="button"
              accessibilityLabel="Ta bort konto"
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.favorite, backgroundColor: theme.card },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" themeColor="favorite" style={styles.secondaryButtonText}>
                Ta bort konto
              </ThemedText>
            </Pressable>
          </ProfileSection>
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.seven,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  profileText: {
    flex: 1,
    gap: Spacing.one,
  },
  name: {
    letterSpacing: -0.2,
  },
  settingsList: {
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
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
