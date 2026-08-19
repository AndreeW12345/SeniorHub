import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function OrganizerHeroSection() {
  const theme = useTheme();

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      <View style={[styles.illustration, { backgroundColor: theme.primaryLight }]}>
        <ThemedText style={styles.illustrationEmoji} accessibilityLabel="Gemenskap och aktiviteter">
          🤝
        </ThemedText>
        <View style={styles.illustrationOrbit}>
          <ThemedText style={styles.orbitEmoji}>👥</ThemedText>
          <ThemedText style={styles.orbitEmoji}>📅</ThemedText>
          <ThemedText style={styles.orbitEmoji}>☕</ThemedText>
        </View>
      </View>

      <ThemedText type="title" style={styles.title}>
        Bli arrangör i SeniorHub
      </ThemedText>
      <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.subtitle}>
        Skapa aktiviteter som gör skillnad och hjälp seniorer att hitta gemenskap i ditt närområde.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.five + 4,
    gap: Spacing.five,
    alignItems: 'center',
  },
  illustration: {
    width: '100%',
    minHeight: 180,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  illustrationEmoji: {
    fontSize: 72,
    lineHeight: 84,
  },
  illustrationOrbit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  orbitEmoji: {
    fontSize: 36,
    lineHeight: 44,
  },
  title: {
    textAlign: 'center',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 34,
    maxWidth: 640,
  },
});
