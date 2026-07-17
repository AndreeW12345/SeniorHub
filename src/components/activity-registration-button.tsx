import * as Linking from 'expo-linking';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import {
  ActivityRegistrationFormModal,
  type ActivityRegistrationFormMode,
} from '@/components/activity-registration-form-modal';
import { ThemedText } from '@/components/themed-text';
import type { Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useRegistrations } from '@/contexts/registrations-context';
import { useTheme } from '@/hooks/use-theme';
import { incrementActivityParticipants } from '@/services/activities';
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
import { getEmailUrl, getPhoneUrl, normalizeWebsiteUrl } from '@/utils/organizer-links';

type ActivityRegistrationButtonProps = {
  activity: Activity;
  /** Live booked count from registrations; used for full/capacity checks. */
  bookedCount?: number;
  /** Called after registration or cancellation so parents can refresh seat counts. */
  onRegistrationComplete?: () => void | Promise<void>;
};

function SuccessBanner({ message }: { message: string }) {
  return (
    <View
      style={[styles.successBanner, CardShadow, { backgroundColor: '#E8F6EE' }]}
      accessibilityLabel={message}>
      <View style={[styles.successIconWrap, { backgroundColor: '#D4EFDF' }]}>
        <SymbolView
          tintColor="#1B7A4E"
          name={{
            ios: 'checkmark.circle.fill',
            android: 'check_circle',
            web: 'check_circle',
          }}
          size={28}
        />
      </View>
      <ThemedText type="bodyLarge" style={styles.successText}>
        {message}
      </ThemedText>
    </View>
  );
}

/** Primary registration button – book, waitlist, cancel, or open external contact methods. */
export function ActivityRegistrationButton({
  activity,
  bookedCount,
  onRegistrationComplete,
}: ActivityRegistrationButtonProps) {
  const theme = useTheme();
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setSuccessMessage(null);

    try {
      const result = await incrementActivityParticipants(activity.id);

      if (!result.ok) {
        showErrorAlert('Kunde inte anmäla dig', result.errorMessage);
        return;
      }

      markAsRegistered(activity.id);
      await refreshActivities();
      await onRegistrationComplete?.();

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

    setSuccessMessage(null);

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
      setSuccessMessage('Du har lagts till på reservlistan.');
    } else {
      markAsRegistered(activity.id, nextRegistrationId);
      setSuccessMessage(null);
    }

    setIsFormVisible(false);
    await refreshActivities();
    await onRegistrationComplete?.();
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
          showErrorAlert('Kunde inte avanmäla dig', result.errorMessage);
          return;
        }
      }

      removeRegistration(activity.id);
      setSuccessMessage('Du har avanmält dig från aktiviteten.');
      await refreshActivities();
      await onRegistrationComplete?.();
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
      setSuccessMessage('Du har lämnat reservlistan.');
      await refreshActivities();
      await onRegistrationComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPress = () => {
    confirmDestructiveAction(
      'Avanmälan',
      'Är du säker på att du vill avanmäla dig från aktiviteten?',
      'Avanmäl mig',
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
      <Pressable
        onPress={handleCancelPress}
        accessibilityRole="button"
        accessibilityLabel="Avanmäl mig"
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
              Avanmäler...
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="bodyLarge" themeColor="favorite" style={styles.cancelButtonText}>
            Avanmäl mig
          </ThemedText>
        )}
      </Pressable>
    );
  }

  if (onWaitlist) {
    return (
      <>
        {successMessage ? <SuccessBanner message={successMessage} /> : null}
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
      </>
    );
  }

  const buttonDisabled = !canOpenRegistration || isSubmitting;
  const buttonLabel =
    !usesSeniorHubForm && full ? 'Fullbokad' : 'Anmäl mig';

  return (
    <>
      {successMessage ? <SuccessBanner message={successMessage} /> : null}

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
  successBanner: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  successIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    flex: 1,
    color: '#1B7A4E',
    fontWeight: '700',
    lineHeight: 30,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.75,
  },
});
