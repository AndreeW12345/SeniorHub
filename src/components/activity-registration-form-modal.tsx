import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { submitActivityRegistration } from '@/services/registrations/submit-activity-registration';
import { submitWaitlistRegistration } from '@/services/registrations/submit-waitlist-registration';

export type ActivityRegistrationFormMode = 'registered' | 'waitlist';

type ActivityRegistrationFormModalProps = {
  visible: boolean;
  activityId: string;
  activityTitle: string;
  /** When "waitlist", saves status waitlist without taking a seat. */
  mode?: ActivityRegistrationFormMode;
  onClose: () => void;
  onSuccess: (registrationId: string, mode: ActivityRegistrationFormMode) => void;
};

type FormErrors = {
  name?: string;
  phone?: string;
};

/** Modal form for SeniorHub in-app registration (name + phone). */
export function ActivityRegistrationFormModal({
  visible,
  activityId,
  activityTitle,
  mode = 'registered',
  onClose,
  onSuccess,
}: ActivityRegistrationFormModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWaitlist = mode === 'waitlist';

  const resetForm = () => {
    setName('');
    setPhone('');
    setErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Ange ditt namn.';
    }

    if (!phone.trim()) {
      nextErrors.phone = 'Ange ditt telefonnummer.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleConfirm = async () => {
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const input = {
        name: name.trim(),
        phone: phone.trim(),
      };

      const result = isWaitlist
        ? await submitWaitlistRegistration(activityId, input)
        : await submitActivityRegistration(activityId, input);

      if (!result.ok) {
        setSubmitError(result.errorMessage);
        return;
      }

      resetForm();
      onSuccess(result.registrationId, mode);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <View
            style={[
              styles.sheet,
              CardShadow,
              {
                backgroundColor: theme.card,
                paddingBottom: Math.max(insets.bottom, Spacing.four),
              },
            ]}>
            <ThemedText type="sectionTitle" style={styles.title}>
              {isWaitlist ? 'Reservlista' : 'Anmäl dig'}
            </ThemedText>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.subtitle}>
              {isWaitlist
                ? `Aktiviteten är fullbokad. Du kan ställa dig i kö till ${activityTitle}.`
                : activityTitle}
            </ThemedText>

            <FormField
              label="Namn *"
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (errors.name) {
                  setErrors((current) => ({ ...current, name: undefined }));
                }
              }}
              error={errors.name}
              placeholder="Ditt namn"
              autoCapitalize="words"
              editable={!isSubmitting}
            />

            <FormField
              label="Telefonnummer *"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                if (errors.phone) {
                  setErrors((current) => ({ ...current, phone: undefined }));
                }
              }}
              error={errors.phone}
              placeholder="Till exempel 070-123 45 67"
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />

            {submitError ? (
              <ThemedText type="bodyLarge" themeColor="favorite" style={styles.submitError}>
                {submitError}
              </ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isWaitlist ? 'Bekräfta reservlista' : 'Bekräfta anmälan'}
              disabled={isSubmitting}
              onPress={() => void handleConfirm()}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primary },
                (pressed || isSubmitting) && styles.pressed,
                isSubmitting && styles.disabled,
              ]}>
              {isSubmitting ? (
                <View style={styles.busyRow}>
                  <ActivityIndicator color="#FFFFFF" />
                  <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                    {isWaitlist ? 'Sparar...' : 'Sparar anmälan...'}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                  {isWaitlist ? 'Ställ dig på reservlistan' : 'Bekräfta anmälan'}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Avbryt"
              disabled={isSubmitting}
              onPress={handleClose}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.secondaryButtonText}>
                Avbryt
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 42, 67, 0.45)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    gap: Spacing.four,
  },
  title: {
    letterSpacing: -0.2,
  },
  subtitle: {
    lineHeight: 30,
    marginTop: -Spacing.two,
  },
  submitError: {
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.8,
  },
});
