import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ActivityCardMetaRow } from '@/components/activity-card-meta-row';
import { ActivitySchedule } from '@/components/activity-schedule';
import { ThemedText } from '@/components/themed-text';
import { WaitlistInfoBanner } from '@/components/waitlist-info-banner';
import type { Activity } from '@/constants/activities';
import { getActivityPlaceName } from '@/constants/activities';
import { getCategoryEmoji, getCategoryVisual } from '@/constants/category-visuals';
import { useActivities } from '@/contexts/activities-context';
import { useNotifications } from '@/contexts/notifications-context';
import {
  useRegistrations,
  type LocalRegistrationStatus,
} from '@/contexts/registrations-context';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useActivitySeatAvailability } from '@/hooks/use-activity-seat-availability';
import { cancelActivityReminders } from '@/services/notifications';
import {
  cancelActivityRegistration,
  leaveWaitlistRegistration,
} from '@/services/registrations';
import { confirmDestructiveAction, showErrorAlert } from '@/utils/confirm-alert';
import { getBookingStatusLabel } from '@/utils/my-bookings';
import { createCancellationNotification } from '@/utils/notifications';
import { formatWaitlistPositionLabel } from '@/utils/waitlist';

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
  const registrationId = getRegistrationId(activity.id);
  const { getWaitlistPositionFor } = useActivitySeatAvailability(
    status === 'waitlist' ? activity : undefined,
  );
  const waitlistPosition =
    status === 'waitlist' ? getWaitlistPositionFor(registrationId) : null;

  const statusLabel = getBookingStatusLabel(status, waitlistPosition);
  const isWaitlist = status === 'waitlist';
  const placeName = getActivityPlaceName(activity);
  const categoryVisual = getCategoryVisual(activity.category);
  const categoryEmoji = getCategoryEmoji(activity.category);

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
        await cancelActivityReminders(activity.id);
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
      isWaitlist ? 'Lämna väntelistan' : 'Avanmälan',
      isWaitlist
        ? 'Vill du lämna väntelistan för denna aktivitet?'
        : 'Vill du avanmäla dig från denna aktivitet?',
      isWaitlist ? 'Lämna väntelistan' : 'Ja, avanmäl mig',
      () => {
        void performCancel();
      },
    );
  };

  return (
    <View
      style={[styles.card, CardShadow, { backgroundColor: theme.card }]}
      accessibilityLabel={`${activity.title}, ${statusLabel}`}>
      <View style={styles.topRow}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryVisual.tint }]}>
          <ThemedText style={styles.categoryEmoji}>{categoryEmoji}</ThemedText>
          <ThemedText
            type="smallBold"
            style={[styles.categoryLabel, { color: categoryVisual.background }]}>
            {activity.category}
          </ThemedText>
        </View>

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

      <ThemedText type="cardTitle" style={styles.title}>
        {activity.title}
      </ThemedText>

      <View style={styles.metaGroup}>
        <ActivitySchedule date={activity.date} time={activity.time} />
        <ActivityCardMetaRow icon="📍" value={placeName} accessibilityPrefix="Plats" />
        {isWaitlist && typeof waitlistPosition === 'number' ? (
          <ActivityCardMetaRow
            icon="⏳"
            value={formatWaitlistPositionLabel(waitlistPosition)}
            accessibilityPrefix="Väntelisteplats"
          />
        ) : null}
        {isWaitlist ? <WaitlistInfoBanner /> : null}
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
        accessibilityLabel={isWaitlist ? 'Lämna väntelistan' : 'Avanmäl'}
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
              {isWaitlist ? 'Lämnar...' : 'Avanmäler...'}
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="bodyLarge" themeColor="favorite" style={styles.cancelButtonText}>
            {isWaitlist ? 'Lämna väntelistan' : 'Avanmäl'}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five + 4,
    gap: Spacing.four + 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  categoryBadge: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two,
  },
  categoryEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  categoryLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 24,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  metaGroup: {
    gap: Spacing.three + 4,
  },
  button: {
    minHeight: 60,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.one,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
  },
  cancelButton: {
    minHeight: 60,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  cancelButtonText: {
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
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
