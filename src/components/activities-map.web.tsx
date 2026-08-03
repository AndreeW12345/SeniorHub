import { useRouter, type Href } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { MapActivityPreviewCard } from '@/components/map-activity-preview-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { hasActivityCoordinates, type Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActivitiesMapProps = {
  activities: Activity[];
};

/** Web fallback when native maps are unavailable. */
export function ActivitiesMap({ activities }: ActivitiesMapProps) {
  const theme = useTheme();
  const router = useRouter();
  const mapActivities = activities.filter(hasActivityCoordinates);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          Den interaktiva kartan med markörer visas i Expo Go och iOS/Android. Här kan du öppna
          aktiviteter som har koordinater.
        </ThemedText>
      </ThemedView>

      {mapActivities.length > 0 ? (
        <View style={styles.list}>
          {mapActivities.map((activity) => (
            <MapActivityPreviewCard
              key={activity.id}
              activity={activity}
              onViewActivity={() => router.push(`/activity/${activity.id}` as Href)}
            />
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
});
