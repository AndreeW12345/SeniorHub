import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HomeOrganizerCtaProps = {
  onPress: () => void;
};

export function HomeOrganizerCta({ onPress }: HomeOrganizerCtaProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        CardShadow,
        { backgroundColor: theme.backgroundSelected },
      ]}>
      <ThemedText type="sectionTitle" style={styles.title}>
        Arrangerar du aktiviteter?
      </ThemedText>
      <ThemedText type="bodyLarge" themeColor="textSecondary">
        Publicera aktiviteter och nå deltagare i ditt närområde med SeniorHub.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bli arrangör"
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary },
          pressed && styles.buttonPressed,
        ]}>
        <ThemedText type="bodyLarge" style={styles.buttonText}>
          Bli arrangör
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.five,
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
  },
  button: {
    minHeight: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
