import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ActivityList, ActivityListItem } from '@/components/activity-list';
import { BookingCard } from '@/components/booking-card';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useRegistrations } from '@/contexts/registrations-context';
import { useToast } from '@/contexts/toast-context';
import { useTheme } from '@/hooks/use-theme';
import { buildSortedMyBookings } from '@/utils/my-bookings';

export default function MinaBokningarScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const { getActivityById, isLoading: activitiesLoading } = useActivities();
  const { localBookings, isLoading: registrationsLoading } = useRegistrations();

  const bookings = useMemo(
    () => buildSortedMyBookings(localBookings, getActivityById),
    [localBookings, getActivityById],
  );

  const isLoading = activitiesLoading || registrationsLoading;

  return (
    <ScreenLayout title="Mina bokningar" subtitle="Dina anmälda aktiviteter">
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Laddar bokningar...
          </ThemedText>
        </View>
      ) : bookings.length > 0 ? (
        <ActivityList>
          {bookings.map(({ activity, status }) => (
            <ActivityListItem key={`${activity.id}-${status}`}>
              <BookingCard
                activity={activity}
                status={status}
                onCancelled={() =>
                  showToast({
                    type: 'success',
                    title: 'Du har avanmält dig.',
                  })
                }
              />
            </ActivityListItem>
          ))}
        </ActivityList>
      ) : (
        <View style={[styles.emptyState, CardShadow, { backgroundColor: theme.card }]}>
          <SymbolView
            tintColor={theme.primary}
            name={{
              ios: 'ticket',
              android: 'confirmation_number',
              web: 'confirmation_number',
            }}
            size={52}
          />
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
            Du har inga bokade aktiviteter ännu.
          </ThemedText>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.seven,
    gap: Spacing.four,
  },
  emptyState: {
    borderRadius: Radius.xl,
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 340,
    fontWeight: '600',
  },
});
