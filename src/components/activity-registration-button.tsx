import * as Linking from 'expo-linking';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import {
  ActivityRegistrationFormModal,
  type ActivityRegistrationFormMode,
} from '@/components/activity-registration-form-modal';
import { ThemedText } from '@/components/themed-text';
import type { Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useNotificationPreferences } from '@/contexts/notification-preferences-context';
import { useNotifications } from '@/contexts/notifications-context';
import { useRegistrations } from '@/contexts/registrations-context';
import { useToast } from '@/contexts/toast-context';
import { useTheme } from '@/hooks/use-theme';
import { incrementActivityParticipants } from '@/services/activities';
import {
  cancelActivityReminders,
  scheduleActivityReminders,
  sendLocalBookingConfirmation,
} from '@/services/notifications';
import {
  cancelActivityRegistration,
  leaveWaitlistRegistration,
} from '@/services/registrations';
import { confirmDestructiveAction, showErrorAlert } from '@/utils/confirm-alert';
import {
  getActivityRegistrationAction,
  isActivityFullWithBookedCount,
  isActivityRegistrationRequired,
} from '@/utils/activity-registration';
import {
  createCancellationNotification,
  createRegistrationConfirmedNotification,
} from '@/utils/notifications';
import { getEmailUrl, getPhoneUrl, normalizeWebsiteUrl } from '@/utils/organizer-links';

type ActivityRegistrationButtonProps = {
  activity: Activity;
  /** Live booked count from registrations; used for full/capacity checks. */
  bookedCount?: number;
  /**
   * Called after registration or cancellation so parents can refresh seat counts.
   * `seatDelta` is +1 on book and -1 on cancel for instant UI updates.
   */
  onRegistrationComplete?: (seatDelta?: number) => void | Promise<void>;
};

/** Primary registration button – book, waitlist, cancel, or open external contact methods. */
export function ActivityRegistrationButton({
  activity,
  bookedCount,
  onRegistrationComplete,
}: ActivityRegistrationButtonProps) {
  const theme = useTheme();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { preferences } = useNotificationPreferences();
  const { refreshActivities } = useActivities();
  const {
    isRegistered,
    isOnWaitlist,
    getRegistrationId,
    markAsRegistered,
    markAsWaitlisted,
    removeRegistration,
  } = useRegistrations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const notifyBookingConfirmed = async () => {
    addNotification(createRegistrationConfirmedNotification(activity.title));
    await sendLocalBookingConfirmation(activity.title);
    await scheduleActivityReminders(activity, preferences);
  };

  if (!isActivityRegistrationRequired(activity)) {
    return null;
  }

  const action = getActivityRegistrationAction(activity);
  const full = isActivityFullWithBookedCount(activity, bookedCount);
  const registered = isRegistered(activity.id);
  const onWaitlist = isOnWaitlist(activity.id);
  const usesSeniorHubForm = action?.method === 'seniorhub';
  const registrationId = getRegistrationId(activity.id);
  const formMode: ActivityRegistrationFormMode =
    full && usesSeniorHubForm ? 'waitlist' : 'registered';
  /** SeniorHub waitlist is allowed when full; external methods stay blocked when full. */
  const canOpenRegistration = usesSeniorHubForm ? !registered && !onWaitlist : !full && !registered;

  const handleExternalRegistration = async () => {
    if (!action || action.method === 'seniorhub' || full || registered || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await incrementActivityParticipants(activity.id);

      if (!result.ok) {
        showErrorAlert('Kunde inte anmäla dig', result.errorMessage);
        return;
      }

      markAsRegistered(activity.id);
      await notifyBookingConfirmed();
      showToast({
        type: 'success',
        title: 'Du är nu anmäld.',
      });
      await onRegistrationComplete?.(1);
      await refreshActivities();

      if (action.method === 'external') {
        void Linking.openURL(normalizeWebsiteUrl(action.url));
        return;
      }

      if (action.method === 'phone') {
        void Linking.openURL(getPhoneUrl(action.phone));
        return;
      }

      if (action.method === 'email') {
        void Linking.openURL(getEmailUrl(action.email));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePress = () => {
    if (!action || !canOpenRegistration || isSubmitting) {
      return;
    }

    if (usesSeniorHubForm) {
      setIsFormVisible(true);
      return;
    }

    void handleExternalRegistration();
  };

  const handleFormSuccess = async (
    nextRegistrationId: string,
    mode: ActivityRegistrationFormMode,
  ) => {
    if (mode === 'waitlist') {
      markAsWaitlisted(activity.id, nextRegistrationId);
      showToast({
        type: 'success',
        title: 'Du har lagts till på reservlistan.',
      });
      setIsFormVisible(false);
      await onRegistrationComplete?.(0);
      await refreshActivities();
      return;
    }

    markAsRegistered(activity.id, nextRegistrationId);
    await notifyBookingConfirmed();
    showToast({
      type: 'success',
      title: 'Du är nu anmäld.',
    });
    setIsFormVisible(false);
    await onRegistrationComplete?.(1);
    await refreshActivities();
  };

  const performCancel = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (registrationId) {
        const result = await cancelActivityRegistration(activity.id, registrationId);

        if (!result.ok) {
          showErrorAlert('Kunde inte avboka', result.errorMessage);
          return;
        }
      }

      removeRegistration(activity.id);
      await cancelActivityReminders(activity.id);
      addNotification(createCancellationNotification(activity.title));
      showToast({
        type: 'warning',
        title: 'Din bokning har tagits bort.',
      });
      await onRegistrationComplete?.(-1);
      await refreshActivities();
    } finally {
      setIsSubmitting(false);
    }
  };

  const performLeaveWaitlist = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (registrationId) {
        const result = await leaveWaitlistRegistration(activity.id, registrationId);

        if (!result.ok) {
          showErrorAlert('Kunde inte lämna reservlistan', result.errorMessage);
          return;
        }
      }

      removeRegistration(activity.id);
      showToast({
        type: 'success',
        title: 'Du har lämnat reservlistan.',
      });
      await onRegistrationComplete?.(0);
      await refreshActivities();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPress = () => {
    confirmDestructiveAction(
      'Avbokning',
      'Är du säker på att du vill avboka din plats?',
      'Avboka',
      () => {
        void performCancel();
      },
    );
  };

  const handleLeaveWaitlistPress = () => {
    confirmDestructiveAction(
      'Lämna reservlista',
      'Är du säker på att du vill lämna reservlistan?',
      'Lämna reservlista',
      () => {
        void performLeaveWaitlist();
      },
    );
  };

  if (registered) {
    return (
      <View style={styles.registeredBlock}>
        <View
          style={[styles.registeredBadge, { backgroundColor: '#E8F6EE', borderColor: '#D4EFDF' }]}
          accessibilityRole="text"
          accessibilityLabel="Anmäld">
          <ThemedText type="bodyLarge" style={styles.registeredBadgeText}>
            Anmäld ✓
          </ThemedText>
        </View>

        <Pressable
          onPress={handleCancelPress}
          accessibilityRole="button"
          accessibilityLabel="Avboka"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.cancelButton,
            CardShadow,
            { backgroundColor: theme.card, borderColor: theme.favorite },
            (pressed || isSubmitting) && styles.pressed,
            isSubmitting && styles.disabled,
          ]}>
          {isSubmitting ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={theme.favorite} />
              <ThemedText type="bodyLarge" themeColor="favorite" style={styles.cancelButtonText}>
                Avbokar...
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="bodyLarge" themeColor="favorite" style={styles.cancelButtonText}>
              Avboka
            </ThemedText>
          )}
        </Pressable>
      </View>
    );
  }

  if (onWaitlist) {
    return (
      <Pressable
        onPress={handleLeaveWaitlistPress}
        accessibilityRole="button"
        accessibilityLabel="Lämna reservlista"
        accessibilityState={{ disabled: isSubmitting }}
        disabled={isSubmitting}
        style={({ pressed }) => [
          styles.cancelButton,
          CardShadow,
          { backgroundColor: theme.card, borderColor: theme.favorite },
          (pressed || isSubmitting) && styles.pressed,
          isSubmitting && styles.disabled,
        ]}>
        {isSubmitting ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color={theme.favorite} />
            <ThemedText type="bodyLarge" themeColor="favorite" style={styles.cancelButtonText}>
              Lämnar...
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="bodyLarge" themeColor="favorite" style={styles.cancelButtonText}>
            Lämna reservlista
          </ThemedText>
        )}
      </Pressable>
    );
  }

  const buttonDisabled = !canOpenRegistration || isSubmitting;
  const buttonLabel =
    !usesSeniorHubForm && full ? 'Fullbokad' : 'Anmäl mig';

  return (
    <>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityState={{ disabled: buttonDisabled }}
        disabled={buttonDisabled}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary },
          (pressed || buttonDisabled) && styles.pressed,
          buttonDisabled && styles.disabled,
        ]}>
        <ThemedText type="bodyLarge" style={styles.buttonText}>
          {buttonLabel}
        </ThemedText>
      </Pressable>

      {usesSeniorHubForm ? (
        <ActivityRegistrationFormModal
          visible={isFormVisible}
          activityId={activity.id}
          activityTitle={activity.title}
          mode={formMode}
          onClose={() => setIsFormVisible(false)}
          onSuccess={(nextRegistrationId, mode) => {
            void handleFormSuccess(nextRegistrationId, mode);
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginBottom: Spacing.two,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  registeredBlock: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  registeredBadge: {
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  registeredBadgeText: {
    color: '#1B7A4E',
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginBottom: Spacing.two,
  },
  cancelButtonText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.75,
  },
});
