import { Pressable, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';

/** About SeniorHub screen. */
export default function AboutSeniorHubScreen() {
  const theme = useTheme();
  const goBack = useSafeBack();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScreenLayout title="Om SeniorHub" subtitle="Aktiviteter nära dig" omitTabInset>
      <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
        <ThemedText type="sectionTitle">SeniorHub</ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          SeniorHub hjälper dig att hitta och anmäla dig till aktiviteter i ditt närområde. Appen är
          byggd med stora texter, tydliga knappar och enkel navigation.
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
          Version {version}
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
