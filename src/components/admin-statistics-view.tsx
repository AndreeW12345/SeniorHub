import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { AdminStatCard } from '@/components/admin-stat-card';
import { ThemedText } from '@/components/themed-text';
import {
  EMPTY_ADMIN_STATISTICS,
  type AdminStatistics,
} from '@/constants/admin-statistics';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { fetchAdminStatistics } from '@/services/stats';

/** Admin statistics body – overview, popular activities, and this-month metrics. */
export function AdminStatisticsView() {
  const theme = useTheme();
  const { isCompact } = useResponsive();
  const { adminAccount } = useAuth();
  const [statistics, setStatistics] = useState<AdminStatistics>(EMPTY_ADMIN_STATISTICS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const organizationId = adminAccount?.organizationId?.trim();
      if (!organizationId) {
        setStatistics(EMPTY_ADMIN_STATISTICS);
        return;
      }

      const next = await fetchAdminStatistics(new Date(), { organizationId });
      setStatistics(next);
    } catch (error) {
      console.warn('[SeniorHub] Kunde inte hämta statistik:', error);
      setStatistics(EMPTY_ADMIN_STATISTICS);
      setErrorMessage('Kunde inte hämta statistiken. Försök igen senare.');
    } finally {
      setIsLoading(false);
    }
  }, [adminAccount?.organizationId]);

  useFocusEffect(
    useCallback(() => {
      void loadStatistics();
    }, [loadStatistics]),
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Hämtar statistik...
        </ThemedText>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <ThemedText type="bodyLarge" themeColor="favorite">
        {errorMessage}
      </ThemedText>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <ThemedText type="sectionTitle">Översikt</ThemedText>
        <View style={[styles.grid, isCompact && styles.gridCompact]}>
          <AdminStatCard label="Aktiva aktiviteter" value={String(statistics.activeActivities)} />
          <AdminStatCard
            label="Registrerade deltagare"
            value={String(statistics.totalRegisteredParticipants)}
          />
          <AdminStatCard
            label="Genomsnittlig beläggning"
            value={`${statistics.averageOccupancyPercent} %`}
          />
          <AdminStatCard label="Personer i väntelista" value={String(statistics.totalWaitlist)} />
          <AdminStatCard
            label="Inställda aktiviteter"
            value={String(statistics.cancelledActivities)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="sectionTitle">Populäraste aktiviteter</ThemedText>
        {statistics.popularActivities.length === 0 ? (
          <View style={[styles.emptyCard, CardShadow, { backgroundColor: theme.card }]}>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
              Inga deltagare ännu.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {statistics.popularActivities.map((activity, index) => (
              <View
                key={activity.id}
                style={[
                  styles.popularCard,
                  CardShadow,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.rank}>
                  {index + 1}.
                </ThemedText>
                <View style={styles.popularContent}>
                  <ThemedText type="bodyLarge" style={styles.popularTitle}>
                    {activity.title}
                  </ThemedText>
                  <ThemedText type="bodyLarge" themeColor="textSecondary">
                    {activity.participantCount} deltagare
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="sectionTitle">Denna månad</ThemedText>
        <View style={[styles.grid, isCompact && styles.gridCompact]}>
          <AdminStatCard
            label="Skapade aktiviteter"
            value={String(statistics.thisMonth.createdActivities)}
          />
          <AdminStatCard
            label="Genomförda aktiviteter"
            value={String(statistics.thisMonth.completedActivities)}
          />
          <AdminStatCard label="Avbokningar" value={String(statistics.thisMonth.cancellations)} />
          <AdminStatCard
            label="Uppflyttade från väntelista"
            value={String(statistics.thisMonth.waitlistPromotions)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.six,
    width: '100%',
  },
  section: {
    gap: Spacing.four,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  gridCompact: {
    flexDirection: 'column',
  },
  centered: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.six,
  },
  list: {
    gap: Spacing.three,
  },
  popularCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  rank: {
    fontWeight: '700',
    minWidth: 28,
  },
  popularContent: {
    flex: 1,
    gap: Spacing.one,
  },
  popularTitle: {
    fontWeight: '700',
    lineHeight: 30,
  },
  emptyCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
