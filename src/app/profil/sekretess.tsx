import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';

/** Simple privacy information for SeniorHub users. */
export default function PrivacyScreen() {
  const theme = useTheme();
  const goBack = useSafeBack();

  return (
    <ScreenLayout title="Sekretess" subtitle="Hur vi hanterar dina uppgifter" omitTabInset>
      <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          SeniorHub sparar dina profiluppgifter (namn, telefon, e-post och eventuell profilbild) i
          Firebase så att de finns kvar när du öppnar appen igen.
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          Bokningar och favoriter sparas lokalt på din enhet. Notisinställningar kan synkas för att
          skicka påminnelser.
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          Du kan när som helst rensa eller ta bort dina profiluppgifter under Profil → Konto.
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
