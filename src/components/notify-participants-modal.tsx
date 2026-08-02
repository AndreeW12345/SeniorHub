import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { useTheme } from '@/hooks/use-theme';
import { createActivityAnnouncement } from '@/services/announcements';

type NotifyParticipantsModalProps = {
  visible: boolean;
  activityId: string;
  activityTitle: string;
  onClose: () => void;
};

type FormErrors = {
  title?: string;
  message?: string;
};

/** Admin dialog for sending a message to booked participants. */
export function NotifyParticipantsModal({
  visible,
  activityId,
  activityTitle,
  onClose,
}: NotifyParticipantsModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setMessage('');
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

    if (!title.trim()) {
      nextErrors.title = 'Ange en rubrik.';
    }

    if (!message.trim()) {
      nextErrors.message = 'Ange ett meddelande.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSend = async () => {
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createActivityAnnouncement(activityId, {
        title: title.trim(),
        message: message.trim(),
        createdBy: user?.email ?? undefined,
      });

      if (!result.ok) {
        setSubmitError(result.errorMessage);
        return;
      }

      resetForm();
      onClose();
      showToast({ type: 'success', title: 'Meddelandet har skickats.' });
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
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              <ThemedText type="sectionTitle" style={styles.title}>
                Meddela deltagare
              </ThemedText>
              <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.subtitle}>
                {activityTitle}
              </ThemedText>

              <FormField
                label="Rubrik *"
                value={title}
                onChangeText={(value) => {
                  setTitle(value);
                  if (errors.title) {
                    setErrors((current) => ({ ...current, title: undefined }));
                  }
                }}
                error={errors.title}
                placeholder="Rubrik på meddelandet"
                editable={!isSubmitting}
              />

              <FormField
                label="Meddelande *"
                value={message}
                onChangeText={(value) => {
                  setMessage(value);
                  if (errors.message) {
                    setErrors((current) => ({ ...current, message: undefined }));
                  }
                }}
                error={errors.message}
                placeholder="Skriv ditt meddelande till deltagarna"
                multiline
                editable={!isSubmitting}
              />

              {submitError ? (
                <ThemedText type="bodyLarge" themeColor="favorite" style={styles.submitError}>
                  {submitError}
                </ThemedText>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Skicka meddelande"
                disabled={isSubmitting}
                onPress={() => void handleSend()}
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
                      Skickar...
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                    Skicka
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
                <ThemedText
                  type="bodyLarge"
                  themeColor="textSecondary"
                  style={styles.secondaryButtonText}>
                  Avbryt
                </ThemedText>
              </Pressable>
            </ScrollView>
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
    maxHeight: '92%',
  },
  scrollContent: {
    gap: Spacing.four,
    paddingBottom: Spacing.two,
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
