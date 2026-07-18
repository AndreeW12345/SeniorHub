import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastProps = {
  type: ToastType;
  title: string;
  message?: string;
  onDismiss?: () => void;
  durationMs?: number;
};

const DEFAULT_VISIBLE_MS = 3000;
const FADE_MS = 280;

const TOAST_STYLES: Record<
  ToastType,
  {
    background: string;
    iconBackground: string;
    color: string;
    icon: SymbolViewProps['name'];
  }
> = {
  success: {
    background: '#E8F6EE',
    iconBackground: '#D4EFDF',
    color: '#1B7A4E',
    icon: {
      ios: 'checkmark.circle.fill',
      android: 'check_circle',
      web: 'check_circle',
    },
  },
  error: {
    background: '#FDECEE',
    iconBackground: '#F8D7DA',
    color: '#C81E3A',
    icon: {
      ios: 'xmark.circle.fill',
      android: 'cancel',
      web: 'cancel',
    },
  },
  warning: {
    background: '#FFF6E5',
    iconBackground: '#FFE8BF',
    color: '#9A6700',
    icon: {
      ios: 'exclamationmark.triangle.fill',
      android: 'warning',
      web: 'warning',
    },
  },
  info: {
    background: '#E8F2FA',
    iconBackground: '#D4E6F5',
    color: '#004E87',
    icon: {
      ios: 'info.circle.fill',
      android: 'info',
      web: 'info',
    },
  },
};

/** Shared toast card – fade in, stay briefly, fade out, or close with X. */
export function Toast({
  type,
  title,
  message,
  onDismiss,
  durationMs = DEFAULT_VISIBLE_MS,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const isDismissingRef = useRef(false);
  const autoHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visual = TOAST_STYLES[type];

  const clearAutoHide = () => {
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
      autoHideTimeoutRef.current = null;
    }
  };

  const dismiss = () => {
    if (isDismissingRef.current) {
      return;
    }

    isDismissingRef.current = true;
    clearAutoHide();
    opacity.stopAnimation();

    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onDismissRef.current?.();
      } else {
        isDismissingRef.current = false;
      }
    });
  };

  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  useEffect(() => {
    isDismissingRef.current = false;
    opacity.setValue(0);

    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();

    autoHideTimeoutRef.current = setTimeout(() => {
      dismissRef.current();
    }, durationMs);

    return () => {
      clearAutoHide();
      opacity.stopAnimation();
    };
  }, [type, title, message, durationMs, opacity]);

  const accessibilityLabel = message ? `${title}. ${message}` : title;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          paddingTop: Math.max(insets.top, Spacing.three) + Spacing.two,
          opacity,
        },
      ]}>
      <View
        style={[
          styles.toast,
          CardShadow,
          { backgroundColor: visual.background, borderColor: visual.iconBackground },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={accessibilityLabel}>
        <View style={[styles.iconWrap, { backgroundColor: visual.iconBackground }]}>
          <SymbolView tintColor={visual.color} name={visual.icon} size={28} />
        </View>

        <View style={styles.textBlock}>
          <ThemedText type="bodyLarge" style={[styles.title, { color: visual.color }]}>
            {title}
          </ThemedText>
          {message ? (
            <ThemedText type="bodyLarge" style={[styles.message, { color: visual.color }]}>
              {message}
            </ThemedText>
          ) : null}
        </View>

        <Pressable
          onPress={() => dismissRef.current()}
          accessibilityRole="button"
          accessibilityLabel="Stäng"
          hitSlop={12}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}>
          <SymbolView
            tintColor={visual.color}
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={20}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  toast: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontWeight: '700',
    lineHeight: 30,
  },
  message: {
    fontWeight: '600',
    lineHeight: 28,
    opacity: 0.9,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {
    opacity: 0.7,
  },
});
