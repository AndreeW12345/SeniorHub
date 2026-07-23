import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';

/** Help and support information. */
export default function HelpSupportScreen() {
  const theme = useTheme();
  const goBack = useSafeBack();

  return (
    <ScreenLayout title="Hjälp & Support" subtitle="Vi finns här om du behöver hjälp" omitTabInset>
      <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
        <ThemedText type="sectionTitle">Så använder du SeniorHub</ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          Bläddra bland aktiviteter, spara favoriter och anmäl dig till evenemang. Under Notiser
          ställer du in påminnelser.
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          Behöver du hjälp med en bokning? Kontakta arrangören via aktivitetens sida, eller fråga
          personalen på din mötesplats.
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          Tekniska problem? Beskriv vad som hände och vilket telefonmodell du använder när du
          kontaktar support.
        </ThemedText>
      </View>

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
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  paragraph: {
    lineHeight: 32,
  },
  backButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
