import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActivityLoginGateModalProps = {
  visible: boolean;
  onLoginPress: () => void;
  onRegisterPress: () => void;
  onClose: () => void;
};

/** Prompts guests to sign in before they can book an activity. */
export function ActivityLoginGateModal({
  visible,
  onLoginPress,
  onRegisterPress,
  onClose,
}: ActivityLoginGateModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
            Logga in för att fortsätta
          </ThemedText>

          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.message}>
            Du behöver vara inloggad eller skapa ett konto för att kunna boka aktiviteter.
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Logga in"
            onPress={onLoginPress}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
              Logga in
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skapa konto"
            onPress={onRegisterPress}
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: theme.primary, backgroundColor: theme.card },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" themeColor="primary" style={styles.secondaryButtonText}>
              Skapa konto
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Avbryt"
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelButton,
              { borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.cancelButtonText}>
              Avbryt
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
    gap: Spacing.three,
  },
  title: {
    letterSpacing: -0.2,
  },
  message: {
    lineHeight: 30,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.two,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  cancelButton: {
    minHeight: 52,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
});
