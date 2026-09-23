import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SuperAdminGuard } from '@/components/super-admin-guard';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SuperAdminPlatformScreen() {
  return (
    <SuperAdminGuard>
      <SuperAdminPlatformScreenContent />
    </SuperAdminGuard>
  );
}

function SuperAdminPlatformScreenContent() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScreenLayout
      title="SeniorHub-administration"
      subtitle="Onboarding av organisationer och administratörer"
      showBackButton
      omitTabInset>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Organisationer"
          onPress={() => router.push('/admin/platform/organizations' as Href)}
          style={({ pressed }) => [
            styles.primaryButton,
            CardShadow,
            { backgroundColor: theme.primary },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
            Organisationer
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skapa organisation"
          onPress={() => router.push('/admin/platform/create-organization' as Href)}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.primary, backgroundColor: theme.background },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.secondaryButtonText}>
            Skapa organisation
          </ThemedText>
        </Pressable>
      </View>

      <View style={[styles.guideCard, CardShadow, { backgroundColor: theme.card }]}>
        <ThemedText type="sectionTitle" style={styles.guideTitle}>
          Vad du kan göra här
        </ThemedText>
        <View style={styles.guideSteps}>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.guideStep}>
            Organisationer — visa alla föreningar, öppna en organisation och redigera profil (namn,
            beskrivning, logotyp m.m.).
          </ThemedText>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.guideStep}>
            Skapa organisation — lägg till en ny tenant med organisations-id och namn.
          </ThemedText>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.guideStep}>
            Hantera organisationer — välj en organisation i listan och spara profilen som deltagare
            ser på den publika organisationssidan.
          </ThemedText>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.guideStep}>
            Hantera administratörer — öppna en organisation och välj Hantera administratörer för att
            lista och bjuda in org-admins.
          </ThemedText>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.four,
    marginBottom: Spacing.five,
  },
  primaryButton: {
    minHeight: 68,
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
    minHeight: 68,
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
  },
  guideCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  guideTitle: {
    textAlign: 'center',
  },
  guideSteps: {
    gap: Spacing.four,
  },
  guideStep: {
    lineHeight: 28,
  },
});
