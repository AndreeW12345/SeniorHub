import * as Linking from 'expo-linking';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ActivityRegistrationFormModal } from '@/components/activity-registration-form-modal';
import { ThemedText } from '@/components/themed-text';
import type { Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useRegistrations } from '@/contexts/registrations-context';
import { useTheme } from '@/hooks/use-theme';
import { incrementActivityParticipants } from '@/services/activities';
import { cancelActivityRegistration } from '@/services/registrations';
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

/** Primary registration button – book, cancel, or open external contact methods. */
export function ActivityRegistrationButton({
  activity,
  bookedCount,
  onRegistrationComplete,
}: ActivityRegistrationButtonProps) {
  const theme = useTheme();
  const { refreshActivities } = useActivities();
  const { isRegistered, getRegistrationId, markAsRegistered, removeRegistration } =
    useRegistrations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [justCancelled, setJustCancelled] = useState(false);

  if (!isActivityRegistrationRequired(activity)) {
    return null;
  }

  const action = getActivityRegistrationAction(activity);
  const full = isActivityFullWithBookedCount(activity, bookedCount);
  const registered = isRegistered(activity.id);
  const usesSeniorHubForm = action?.method === 'seniorhub';
  const registrationId = getRegistrationId(activity.id);

  const handleExternalRegistration = async () => {
    if (!action || action.method === 'seniorhub' || full || registered || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setJustCancelled(false);

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
    if (!action || full || registered || isSubmitting) {
      return;
    }

    setJustCancelled(false);

    if (usesSeniorHubForm) {
      setIsFormVisible(true);
      return;
    }

    void handleExternalRegistration();
  };

  const handleFormSuccess = async (nextRegistrationId: string) => {
    markAsRegistered(activity.id, nextRegistrationId);
    setJustCancelled(false);
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
      setJustCancelled(true);
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

  return (
    <>
      {justCancelled ? (
        <SuccessBanner message="Du har avanmält dig från aktiviteten." />
      ) : null}

      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={full ? 'Fullbokad' : 'Anmäl mig'}
        accessibilityState={{ disabled: full || isSubmitting }}
        disabled={full || isSubmitting}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary },
          (pressed || full || isSubmitting) && styles.pressed,
          (full || isSubmitting) && styles.disabled,
        ]}>
        <ThemedText type="bodyLarge" style={styles.buttonText}>
          {full ? 'Fullbokad' : 'Anmäl mig'}
        </ThemedText>
      </Pressable>

      {usesSeniorHubForm ? (
        <ActivityRegistrationFormModal
          visible={isFormVisible && !full}
          activityId={activity.id}
          activityTitle={activity.title}
          onClose={() => setIsFormVisible(false)}
          onSuccess={(nextRegistrationId) => {
            void handleFormSuccess(nextRegistrationId);
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
