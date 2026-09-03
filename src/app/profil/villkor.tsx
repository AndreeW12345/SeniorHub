import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';

/** Terms of Service — technical draft; requires legal review before public launch. */
export default function TermsScreen() {
  const theme = useTheme();
  const goBack = useSafeBack();

  return (
    <ScreenLayout
      title="Användarvillkor"
      subtitle="Villkor för användning av SeniorHub"
      showBackButton
      omitTabInset>
      <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          UTKAST — måste granskas juridiskt innan publicering
        </ThemedText>

        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          SeniorHub tillhandahåller en plattform för att hitta och anmäla sig till aktiviteter för
          seniorer. Tjänsten tillhandahålls i befintligt skick.
        </ThemedText>

        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          Du ansvarar för att uppgifterna du anger är korrekta. Du får inte missbruka bokningssystemet,
          försöka kringgå kapacitetsgränser eller störa andra användare.
        </ThemedText>

        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          Aktiviteter arrangeras av tredje part (föreningar/organisatörer). SeniorHub ansvarar inte
          för arrangörernas genomförande av aktiviteter — detta ska preciseras i den juridiska
          versionen.
        </ThemedText>

        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          Kontot kan avslutas när som helst via Profil → Konto. Fullständiga villkor om ansvar,
          uppsägning och tvistlösning ska fyllas i efter juridisk granskning.
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
