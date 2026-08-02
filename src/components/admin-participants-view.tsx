import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ParticipantInfoModal } from '@/components/participant-info-modal';
import { ThemedText } from '@/components/themed-text';
import type { ActivityRegistration } from '@/constants/registrations';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { subscribeActivityRegistrations } from '@/services/registrations';
import { sortWaitlistFifo } from '@/utils/waitlist';

type AdminParticipantsViewProps = {
  activityId: string;
};

type SelectedParticipant = {
  registration: ActivityRegistration;
  queuePosition?: number | null;
};

/** Live participant overview for admins: registered + waitlist with tap-for-details. */
export function AdminParticipantsView({ activityId }: AdminParticipantsViewProps) {
  const theme = useTheme();
  const [registrations, setRegistrations] = useState<ActivityRegistration[]>([]);
  const [waitlist, setWaitlist] = useState<ActivityRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedParticipant | null>(null);

  const orderedWaitlist = useMemo(() => sortWaitlistFifo(waitlist), [waitlist]);

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
    <View style={styles.container}>
      <View style={[styles.summaryCard, CardShadow, { backgroundColor: theme.card }]}>
        <ThemedText type="bodyLarge" style={styles.summaryLine}>
          👥 Anmälda: {isLoading ? '…' : registrations.length}
        </ThemedText>
        <ThemedText type="bodyLarge" style={styles.summaryLine}>
          ⏳ Väntelista: {isLoading ? '…' : orderedWaitlist.length}
        </ThemedText>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
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

      {!isLoading && !errorMessage ? (
        <>
          <View style={styles.section}>
            <ThemedText type="sectionTitle" style={styles.sectionTitle}>
              ANMÄLDA
            </ThemedText>

            {registrations.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
                  Inga anmälda deltagare ännu.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.list}>
                {registrations.map((registration) => (
                  <Pressable
                    key={registration.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${registration.name}, status Anmäld`}
                    onPress={() => setSelected({ registration, queuePosition: null })}
                    style={({ pressed }) => [
                      styles.card,
                      CardShadow,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="bodyLarge" style={styles.name}>
                      {registration.name}
                    </ThemedText>
                    <ThemedText type="bodyLarge" themeColor="textSecondary">
                      Status: Anmäld
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText type="sectionTitle" style={styles.sectionTitle}>
              VÄNTELISTA
            </ThemedText>

            {orderedWaitlist.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
                  Ingen står på väntelistan.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.list}>
                {orderedWaitlist.map((registration, index) => {
                  const queuePosition = index + 1;

                  return (
                    <Pressable
                      key={registration.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${registration.name}, köplats ${queuePosition}, status Väntelista`}
                      onPress={() => setSelected({ registration, queuePosition })}
                      style={({ pressed }) => [
                        styles.card,
                        CardShadow,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="bodyLarge" style={styles.name}>
                        {registration.name}
                      </ThemedText>
                      <ThemedText type="bodyLarge" themeColor="textSecondary">
                        Köplats: {queuePosition}
                      </ThemedText>
                      <ThemedText type="bodyLarge" themeColor="textSecondary">
                        Status: Väntelista
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </>
      ) : null}

      <ParticipantInfoModal
        visible={selected !== null}
        registration={selected?.registration ?? null}
        queuePosition={selected?.queuePosition}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.five,
    width: '100%',
  },
  summaryCard: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  summaryLine: {
    fontWeight: '700',
    lineHeight: 32,
  },
  centered: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    letterSpacing: 0.4,
  },
  list: {
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
    minHeight: 72,
  },
  name: {
    fontWeight: '700',
    lineHeight: 30,
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
  pressed: {
    opacity: 0.9,
  },
});
