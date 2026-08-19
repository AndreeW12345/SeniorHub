import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ORGANIZER_ELIGIBILITY_ITEMS } from '@/constants/become-organizer';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function OrganizerEligibilitySection() {
  const theme = useTheme();

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      <ThemedText type="sectionTitle" accessibilityRole="header">
        Vem kan bli arrangör?
      </ThemedText>
      <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.intro}>
        SeniorHub välkomnar bland annat:
      </ThemedText>

      <View style={styles.list}>
        {ORGANIZER_ELIGIBILITY_ITEMS.map((item) => (
          <View key={item} style={styles.listItem}>
            <ThemedText type="bodyLarge" style={styles.bullet}>
              •
            </ThemedText>
            <ThemedText type="bodyLarge" style={styles.listText}>
              {item}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.five + 4,
    gap: Spacing.four,
  },
  intro: {
    fontSize: 22,
    lineHeight: 34,
  },
  list: {
    gap: Spacing.three,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  bullet: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    width: 20,
  },
  listText: {
    flex: 1,
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '600',
  },
});
