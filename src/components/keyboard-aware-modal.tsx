import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ModalProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

type KeyboardAwareModalVariant = 'center' | 'sheet';

type KeyboardAwareModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
  variant?: KeyboardAwareModalVariant;
  animationType?: ModalProps['animationType'];
};

/**
 * Modal with KeyboardAvoidingView + ScrollView so focused inputs stay above the keyboard.
 * Matches existing backdrop styling; use variant="sheet" for bottom sheets.
 */
export function KeyboardAwareModal({
  visible,
  onRequestClose,
  children,
  variant = 'center',
  animationType,
}: KeyboardAwareModalProps) {
  const insets = useSafeAreaInsets();
  const isSheet = variant === 'sheet';
  const resolvedAnimationType = animationType ?? (isSheet ? 'slide' : 'fade');

  return (
    <Modal
      visible={visible}
      transparent
      animationType={resolvedAnimationType}
      onRequestClose={onRequestClose}
      accessibilityViewIsModal>
      <View style={[styles.backdrop, isSheet ? styles.backdropSheet : styles.backdropCenter]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              isSheet ? styles.scrollContentSheet : styles.scrollContentCenter,
              isSheet ? { paddingBottom: Math.max(insets.bottom, Spacing.four) } : null,
            ]}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 42, 67, 0.45)',
  },
  backdropCenter: {
    justifyContent: 'center',
  },
  backdropSheet: {
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
  },
  scrollContentCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  scrollContentSheet: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
});
