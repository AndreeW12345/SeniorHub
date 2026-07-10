import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getActivityDisplayLocation, type Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActivitiesMapProps = {
  activities: Activity[];
};

/** Web fallback when native maps are unavailable. */
export function ActivitiesMap({ activities }: ActivitiesMapProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <ThemedView type="card" style={[styles.infoCard, CardShadow]}>
        <SymbolView
          tintColor={theme.primary}
          name={{ ios: 'map.fill', android: 'map', web: 'map' }}
          size={48}
        />
        <ThemedText type="subtitle" style={styles.infoTitle}>
          Karta i mobilappen
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.infoText}>
          Den interaktiva kartan visas i Expo Go och iOS/Android. Här kan du öppna aktiviteter som
          har koordinater.
        </ThemedText>
      </ThemedView>

      {activities.length > 0 ? (
        <View style={styles.list}>
          {activities.map((activity) => (
            <Pressable
              key={activity.id}
              accessibilityRole="button"
              accessibilityLabel={`Visa ${activity.title}`}
              onPress={() => router.push(`/activity/${activity.id}` as Href)}
              style={({ pressed }) => [
                styles.listItem,
                CardShadow,
                { backgroundColor: theme.card },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.listTitle}>
                {activity.title}
              </ThemedText>
              <ThemedText type="bodyLarge" themeColor="textSecondary">
                {getActivityDisplayLocation(activity)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : (
        <ThemedView type="card" style={[styles.infoCard, CardShadow]}>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.infoText}>
            Inga aktiviteter har koordinater ännu.
          </ThemedText>
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.five,
    gap: Spacing.four,
  },
  infoCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.three,
  },
  infoTitle: {
    textAlign: 'center',
  },
  infoText: {
    textAlign: 'center',
    lineHeight: 32,
    maxWidth: 420,
  },
  list: {
    gap: Spacing.three,
  },
  listItem: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.two,
  },
  listTitle: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },
});
