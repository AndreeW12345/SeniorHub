import { Pressable, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import {
  LegalDocumentRenderer,
  type LegalDocumentDefinition,
} from '@/components/legal/legal-document-renderer';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';

type LegalDocumentScreenProps = {
  document: LegalDocumentDefinition;
  footerLink?: { label: string; href: Href };
};

/** Full-screen legal document with back navigation. */
export function LegalDocumentScreen({ document, footerLink }: LegalDocumentScreenProps) {
  const theme = useTheme();
  const goBack = useSafeBack();
  const router = useRouter();

  return (
    <ScreenLayout
      title={document.screenTitle}
      subtitle={document.screenSubtitle}
      showBackButton
      omitTabInset>
      <LegalDocumentRenderer document={document} />

      {footerLink ? (
        <Pressable
          onPress={() => router.push(footerLink.href)}
          accessibilityRole="link"
          accessibilityLabel={footerLink.label}
          style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.footerLinkText}>
            {footerLink.label}
          </ThemedText>
        </Pressable>
      ) : null}

      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Tillbaka"
        style={({ pressed }) => [
          styles.backButton,
          { borderColor: theme.primary, backgroundColor: theme.card },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.backButtonText}>
          Tillbaka
        </ThemedText>
      </Pressable>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  footerLink: {
    minHeight: 48,
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  footerLinkText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  backButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  backButtonText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
