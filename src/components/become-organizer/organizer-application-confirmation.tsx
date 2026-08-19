import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type OrganizerApplicationConfirmationProps = {
  onBackHome: () => void;
};

export function OrganizerApplicationConfirmation({
  onBackHome,
}: OrganizerApplicationConfirmationProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
          <ThemedText style={styles.icon}>✅</ThemedText>
        </View>

        <ThemedText type="title" style={styles.title}>
          Tack för din ansökan!
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.text}>
          Vi har tagit emot din ansökan.
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.text}>
          Vi granskar alla ansökningar manuellt och återkommer till dig via e-post inom några
          arbetsdagar.
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tillbaka till startsidan"
        onPress={onBackHome}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="bodyLarge" style={styles.buttonText}>
          Tillbaka till startsidan
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.five,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.five + 4,
    gap: Spacing.four + 4,
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
    lineHeight: 56,
  },
  title: {
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.4,
  },
  text: {
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 34,
    maxWidth: 560,
  },
  button: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.92,
  },
});
