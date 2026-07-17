import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AdminFormSection } from '@/components/admin-form-section';
import { ThemedText } from '@/components/themed-text';
import type { ActivityRegistration } from '@/constants/registrations';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { subscribeActivityRegistrations } from '@/services/registrations';

type AdminParticipantListProps = {
  activityId: string;
};

function formatRegisteredAt(date: Date): string {
  const dateLabel = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  const capitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
  return `${capitalized} kl. ${timeLabel}`;
}

function ParticipantRow({
  registration,
  timeLabelPrefix = 'Anmäld',
}: {
  registration: ActivityRegistration;
  timeLabelPrefix?: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      accessibilityLabel={`${registration.name}, telefon ${registration.phone}, ${timeLabelPrefix} ${formatRegisteredAt(registration.registeredAt)}`}>
      <ThemedText type="bodyLarge" style={styles.name}>
        {registration.name}
      </ThemedText>
      <ThemedText type="bodyLarge" themeColor="textSecondary">
        {registration.phone}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.registeredAt}>
        {timeLabelPrefix} {formatRegisteredAt(registration.registeredAt)}
      </ThemedText>
    </View>
  );
}

/** Lists registered participants and waitlist for an activity in the admin editor. */
export function AdminParticipantList({ activityId }: AdminParticipantListProps) {
  const theme = useTheme();
  const [registrations, setRegistrations] = useState<ActivityRegistration[]>([]);
  const [waitlist, setWaitlist] = useState<ActivityRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applyRegistrations = useCallback((next: ActivityRegistration[]) => {
    setRegistrations(next.filter((registration) => registration.status === 'registered'));
    setWaitlist(next.filter((registration) => registration.status === 'waitlist'));
    setIsLoading(false);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);

    const unsubscribe = subscribeActivityRegistrations(
      activityId,
      applyRegistrations,
      () => {
        setRegistrations([]);
        setWaitlist([]);
        setIsLoading(false);
        setErrorMessage('Kunde inte hämta deltagarlistan. Försök igen senare.');
      },
      { includeStatuses: ['registered', 'waitlist'] },
    );

    return unsubscribe;
  }, [activityId, applyRegistrations]);

  return (
    <>
      <AdminFormSection
        title="Anmälda deltagare"
        description={
          isLoading
            ? 'Hämtar anmälningar...'
            : registrations.length > 0
              ? `${registrations.length} ${registrations.length === 1 ? 'deltagare' : 'deltagare'} anmälda.`
              : 'Här visas personer som anmält sig till aktiviteten.'
        }>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
            <ThemedText type="bodyLarge" themeColor="textSecondary">
              Laddar deltagare...
            </ThemedText>
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <ThemedText type="bodyLarge" themeColor="favorite">
            {errorMessage}
          </ThemedText>
        ) : null}

        {!isLoading && !errorMessage && registrations.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
              Inga deltagare ännu.
            </ThemedText>
          </View>
        ) : null}

        {!isLoading && registrations.length > 0 ? (
          <View style={styles.list}>
            {registrations.map((registration) => (
              <ParticipantRow key={registration.id} registration={registration} />
            ))}
          </View>
        ) : null}
      </AdminFormSection>

      <AdminFormSection
        title="Reservlista"
        description={
          isLoading
            ? 'Hämtar reservlista...'
            : waitlist.length > 0
              ? `${waitlist.length} ${waitlist.length === 1 ? 'person' : 'personer'} på reservlistan.`
              : 'Här visas personer som står på reservlistan.'
        }>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
            <ThemedText type="bodyLarge" themeColor="textSecondary">
              Laddar reservlista...
            </ThemedText>
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <ThemedText type="bodyLarge" themeColor="favorite">
            {errorMessage}
          </ThemedText>
        ) : null}

        {!isLoading && !errorMessage && waitlist.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
              Ingen står på reservlistan.
            </ThemedText>
          </View>
        ) : null}

        {!isLoading && waitlist.length > 0 ? (
          <View style={styles.list}>
            {waitlist.map((registration) => (
              <ParticipantRow
                key={registration.id}
                registration={registration}
                timeLabelPrefix="Tillagd"
              />
            ))}
          </View>
        ) : null}
      </AdminFormSection>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  emptyState: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  list: {
    gap: Spacing.three,
  },
  row: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  name: {
    fontWeight: '700',
  },
  registeredAt: {
    marginTop: Spacing.one,
  },
});
