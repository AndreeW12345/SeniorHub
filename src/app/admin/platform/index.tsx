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
          accessibilityLabel="Skapa organisation"
          onPress={() => router.push('/admin/platform/create-organization' as Href)}
          style={({ pressed }) => [
            styles.primaryButton,
            CardShadow,
            { backgroundColor: theme.primary },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
            Skapa organisation
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Organisationer"
          onPress={() => router.push('/admin/platform/organizations' as Href)}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.primary, backgroundColor: theme.background },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.secondaryButtonText}>
            Organisationer
          </ThemedText>
        </Pressable>
      </View>

      <View style={[styles.placeholderCard, CardShadow, { backgroundColor: theme.card }]}>
        <ThemedText type="sectionTitle" style={styles.placeholderTitle}>
          Kommer snart
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.placeholderText}>
          Inbjudan av administratörer aktiveras i kommande steg.
        </ThemedText>
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
  placeholderCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  placeholderTitle: {
    textAlign: 'center',
  },
  placeholderText: {
    textAlign: 'center',
    lineHeight: 28,
  },
});
