import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AdminActivityListItem } from '@/components/admin-activity-list-item';
import { AdminGuard } from '@/components/admin-guard';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { RECURRENCE_FREQUENCY_LABELS } from '@/constants/recurrence';
import { type Activity } from '@/constants/activities';
import { Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useAuth } from '@/contexts/auth-context';
import { fetchActivitiesBySeriesIdFromFirestore } from '@/services/activities/fetch-activities';
import { useTheme } from '@/hooks/use-theme';
import { formatAdminShortDate } from '@/utils/admin-activity-list';
import { canAdminAccessActivity } from '@/utils/activity-organization';

export default function AdminSeriesDetailScreen() {
  return (
    <AdminGuard>
      <AdminSeriesDetailScreenContent />
    </AdminGuard>
  );
}

function AdminSeriesDetailScreenContent() {
  const router = useRouter();
  const theme = useTheme();
  const { adminAccount } = useAuth();
  const { refreshActivities } = useActivities();
  const { seriesId } = useLocalSearchParams<{ seriesId: string }>();
  const [occurrences, setOccurrences] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const trimmedSeriesId = typeof seriesId === 'string' ? seriesId.trim() : '';

  const loadSeries = useCallback(async () => {
    if (!trimmedSeriesId) {
      setOccurrences([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const fetched = await fetchActivitiesBySeriesIdFromFirestore(trimmedSeriesId);
      setOccurrences(fetched);
    } finally {
      setIsLoading(false);
    }
  }, [trimmedSeriesId]);

  useEffect(() => {
    void loadSeries();
  }, [loadSeries]);

  const handleOccurrenceDeleted = useCallback(
    async (_activityId: string) => {
      await refreshActivities();
      const updated = trimmedSeriesId
        ? await fetchActivitiesBySeriesIdFromFirestore(trimmedSeriesId)
        : [];

      if (updated.length === 0) {
        router.replace('/admin' as Href);
        return;
      }

      setOccurrences(updated);
    },
    [refreshActivities, router, trimmedSeriesId],
  );

  if (isLoading) {
    return (
      <ScreenLayout title="Serie" subtitle="Hämtar tillfällen" showBackButton omitTabInset>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Laddar tillfällen...
          </ThemedText>
        </View>
      </ScreenLayout>
    );
  }

  if (!trimmedSeriesId || occurrences.length === 0) {
    return (
      <ScreenLayout title="Serie" subtitle="Serien hittades inte" showBackButton omitTabInset>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Serien kunde inte hittas eller har inga tillfällen kvar.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tillbaka till admin"
          onPress={() => router.replace('/admin' as Href)}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.primary },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.backButtonText}>
            Tillbaka
          </ThemedText>
        </Pressable>
      </ScreenLayout>
    );
  }

  const first = occurrences[0];
  const last = occurrences[occurrences.length - 1];

  if (!canAdminAccessActivity(adminAccount, first)) {
    return (
      <ScreenLayout title="Serie" subtitle="Ingen behörighet" showBackButton omitTabInset>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Du har inte behörighet att se denna serie.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tillbaka till admin"
          onPress={() => router.replace('/admin' as Href)}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.primary },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.backButtonText}>
            Tillbaka
          </ThemedText>
        </Pressable>
      </ScreenLayout>
    );
  }

  const recurrenceLabel = first.recurrence
    ? RECURRENCE_FREQUENCY_LABELS[first.recurrence.frequency]
    : 'Återkommande';
  const subtitle = `${recurrenceLabel} · ${occurrences.length} tillfällen · ${formatAdminShortDate(first.date)} – ${formatAdminShortDate(last.date)}`;

  return (
    <ScreenLayout title={first.title} subtitle={subtitle} showBackButton omitTabInset>
      <View style={styles.list}>
        {occurrences.map((activity) => (
          <AdminActivityListItem
            key={activity.id}
            activity={activity}
            onDeleted={handleOccurrenceDeleted}
          />
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.six,
  },
  list: {
    gap: Spacing.four,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 56,
    borderRadius: Radius.lg,
    borderWidth: 2,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  backButtonText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
