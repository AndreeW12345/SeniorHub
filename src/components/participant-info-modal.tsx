import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { readRegistrationPhone, type ActivityRegistration } from '@/constants/registrations';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ParticipantInfoModalProps = {
  visible: boolean;
  registration: ActivityRegistration | null;
  /** Waitlist queue position when status is waitlist. */
  queuePosition?: number | null;
  onClose: () => void;
};

function getStatusLabel(
  registration: ActivityRegistration,
  queuePosition?: number | null,
): string {
  if (registration.status === 'waitlist') {
    if (typeof queuePosition === 'number' && queuePosition > 0) {
      return `Väntelista · Plats ${queuePosition}`;
    }
    return 'Väntelista';
  }

  return 'Anmäld';
}

/** Simple admin info sheet for a participant (name, phone, status). */
export function ParticipantInfoModal({
  visible,
  registration,
  queuePosition,
  onClose,
}: ParticipantInfoModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!registration) {
    return null;
  }

  const registrationPhone = readRegistrationPhone(registration.phone);
  const statusLabel = getStatusLabel(registration, queuePosition);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stäng"
          onPress={onClose}
          style={styles.backdropDismiss}
        />

        <View
          style={[
            styles.sheet,
            CardShadow,
            {
              backgroundColor: theme.card,
              marginBottom: Math.max(insets.bottom, Spacing.four),
            },
          ]}>
          <ThemedText type="sectionTitle" style={styles.title}>
            Deltagare
          </ThemedText>

          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Namn
            </ThemedText>
            <ThemedText type="bodyLarge" style={styles.value}>
              {registration.name}
            </ThemedText>
          </View>

          {registrationPhone ? (
            <View style={styles.field}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Telefon
              </ThemedText>
              <ThemedText type="bodyLarge" style={styles.value}>
                {registrationPhone}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Status
            </ThemedText>
            <ThemedText type="bodyLarge" style={styles.value}>
              {statusLabel}
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stäng"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              { borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.closeButtonText}>
              Stäng
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 42, 67, 0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.four,
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  title: {
    letterSpacing: -0.2,
  },
  field: {
    gap: Spacing.one,
  },
  value: {
    fontWeight: '600',
    lineHeight: 30,
  },
  closeButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  closeButtonText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
});
