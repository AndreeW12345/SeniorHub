import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useRegistrations } from '@/contexts/registrations-context';
import { useTheme } from '@/hooks/use-theme';
import { incrementActivityParticipants } from '@/services/activities';
import { showErrorAlert } from '@/utils/confirm-alert';
import {
  getActivityRegistrationAction,
  isActivityFull,
  isActivityRegistrationRequired,
} from '@/utils/activity-registration';
import { getEmailUrl, getPhoneUrl, normalizeWebsiteUrl } from '@/utils/organizer-links';

type ActivityRegistrationButtonProps = {
  activity: Activity;
};

/** Primary registration button – prepared for future SeniorHub booking flow. */
export function ActivityRegistrationButton({ activity }: ActivityRegistrationButtonProps) {
  const theme = useTheme();
  const { refreshActivities } = useActivities();
  const { isRegistered, markAsRegistered } = useRegistrations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isActivityRegistrationRequired(activity)) {
    return null;
  }

  const action = getActivityRegistrationAction(activity);
  const full = isActivityFull(activity);
  const registered = isRegistered(activity.id);

  const handlePress = async () => {
    if (!action || full || registered || isSubmitting) {
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

  if (registered) {
    const title =
      action?.method === 'seniorhub' ? '✅ Du är anmäld' : '✅ Anmälan registrerad';

    return (
      <View
        style={[styles.successBanner, CardShadow, { backgroundColor: theme.primaryLight }]}
        accessibilityLabel={`${title}. Din anmälan har registrerats.`}>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.successTitle}>
          {title}
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.successSubtitle}>
          Din anmälan har registrerats.
        </ThemedText>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => void handlePress()}
      accessibilityRole="button"
      accessibilityLabel={full ? 'Aktiviteten är fullbokad' : 'Anmäl mig'}
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
  successBanner: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  successTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  successSubtitle: {
    fontWeight: '600',
    textAlign: 'center',
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
