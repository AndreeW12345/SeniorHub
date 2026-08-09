import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

type HomeAuthenticatedWelcomeProps = {
  firstName: string;
};

export function HomeAuthenticatedWelcome({ firstName }: HomeAuthenticatedWelcomeProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, headerPaddingBottom, isDesktop } = useResponsive();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(16);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [firstName, fadeAnim, slideAnim]);

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.primary,
          paddingTop: insets.top + Spacing.four,
          paddingHorizontal: horizontalPadding,
          paddingBottom: headerPaddingBottom,
        },
      ]}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          gap: Spacing.three,
        }}>
        <ThemedText
          type="title"
          accessibilityRole="header"
          style={[styles.greeting, isDesktop && styles.greetingDesktop]}>
          Hej {firstName} 👋
        </ThemedText>
        <ThemedText type="bodyLarge" style={styles.subtitle}>
          Här är aktiviteter nära dig.
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 42,
  },
  greetingDesktop: {
    fontSize: 42,
    lineHeight: 50,
  },
  subtitle: {
    color: '#C6DCF0',
    fontSize: 22,
    lineHeight: 32,
    maxWidth: 560,
  },
});
