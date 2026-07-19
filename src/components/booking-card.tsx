import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Activity } from '@/constants/activities';
import { getActivityDisplayLocation } from '@/constants/activities';
import { useActivities } from '@/contexts/activities-context';
import { useNotifications } from '@/contexts/notifications-context';
import {
  useRegistrations,
  type LocalRegistrationStatus,
} from '@/contexts/registrations-context';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  cancelActivityRegistration,
  leaveWaitlistRegistration,
} from '@/services/registrations';
import { confirmDestructiveAction, showErrorAlert } from '@/utils/confirm-alert';
import { formatDateDisplay, formatTimeDisplay } from '@/utils/date-time-format';
import { getBookingStatusLabel } from '@/utils/my-bookings';
import { createCancellationNotification } from '@/utils/notifications';

type BookingCardProps = {
  activity: Activity;
  status: LocalRegistrationStatus;
  /** Called after a successful cancellation so the parent can show confirmation. */
  onCancelled?: () => void;
};

/** Card for a local booking on the Mina bokningar screen. */
export function BookingCard({ activity, status, onCancelled }: BookingCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const { refreshActivities } = useActivities();
  const { addNotification } = useNotifications();
  const { getRegistrationId, removeRegistration } = useRegistrations();
  const [isCancelling, setIsCancelling] = useState(false);

  const statusLabel = getBookingStatusLabel(status);
  const isWaitlist = status === 'waitlist';
  const displayLocation = getActivityDisplayLocation(activity);
  const registrationId = getRegistrationId(activity.id);

  const openActivity = () => {
    router.push(`/activity/${activity.id}` as Href);
  };

  const performCancel = async () => {
    if (isCancelling) {
      return;
    }

    setIsCancelling(true);

    try {
      if (registrationId) {
        const result = isWaitlist
          ? await leaveWaitlistRegistration(activity.id, registrationId)
          : await cancelActivityRegistration(activity.id, registrationId);

        if (!result.ok) {
          showErrorAlert('Kunde inte avanmäla dig', result.errorMessage);
          return;
        }
      }

      removeRegistration(activity.id);
      if (!isWaitlist) {
        addNotification(createCancellationNotification(activity.title));
      }
      await refreshActivities();
      onCancelled?.();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelPress = () => {
    confirmDestructiveAction(
      'Avanmälan',
      'Vill du avanmäla dig från denna aktivitet?',
      'Ja, avanmäl mig',
      () => {
        void performCancel();
      },
    );
  };

  return (
    <View
      style={[styles.card, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}
      accessibilityLabel={`${activity.title}, ${statusLabel}`}>
      <View style={styles.headerRow}>
        <ThemedText type="sectionTitle" style={styles.title}>
          {activity.title}
        </ThemedText>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isWaitlist ? theme.primaryLight : '#E8F6EE',
            },
          ]}>
          <ThemedText
            type="smallBold"
            style={[styles.statusText, { color: isWaitlist ? theme.primary : '#1B7A4E' }]}>
            {statusLabel}
          </ThemedText>
        </View>
      </View>

      <View style={styles.details}>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {formatDateDisplay(activity.date)}
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {formatTimeDisplay(activity.time)}
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {displayLocation}
        </ThemedText>
      </View>

      <Pressable
        onPress={openActivity}
        accessibilityRole="button"
        accessibilityLabel={`Visa aktivitet: ${activity.title}`}
        disabled={isCancelling}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary },
          (pressed || isCancelling) && styles.pressed,
          isCancelling && styles.disabled,
        ]}>
        <ThemedText type="bodyLarge" style={styles.buttonText}>
          Visa aktivitet
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={handleCancelPress}
        accessibilityRole="button"
        accessibilityLabel="Avanmäl"
        accessibilityState={{ disabled: isCancelling }}
        disabled={isCancelling}
        style={({ pressed }) => [
          styles.cancelButton,
          { borderColor: theme.favorite, backgroundColor: theme.card },
          (pressed || isCancelling) && styles.pressed,
          isCancelling && styles.disabled,
        ]}>
        {isCancelling ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color={theme.favorite} />
            <ThemedText type="bodyLarge" themeColor="favorite" style={styles.cancelButtonText}>
              Avanmäler...
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="bodyLarge" themeColor="favorite" style={styles.cancelButtonText}>
            Avanmäl
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
    letterSpacing: -0.2,
  },
  statusBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  statusText: {
    fontWeight: '700',
  },
  details: {
    gap: Spacing.two,
  },
  button: {
    minHeight: 56,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  cancelButtonText: {
    fontWeight: '700',
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.75,
  },
});
