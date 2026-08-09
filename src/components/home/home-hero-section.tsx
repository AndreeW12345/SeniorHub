import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, SoftShadow, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

type HomeHeroSectionProps = {
  onExplorePress: () => void;
  onCreateAccountPress: () => void;
  onLoginPress: () => void;
};

export function HomeHeroSection({
  onExplorePress,
  onCreateAccountPress,
  onLoginPress,
}: HomeHeroSectionProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, headerPaddingBottom, isDesktop, isTablet } = useResponsive();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: theme.primary,
          paddingTop: insets.top + Spacing.four,
          paddingHorizontal: horizontalPadding,
          paddingBottom: headerPaddingBottom,
        },
      ]}>
      <Animated.View
        style={[
          styles.heroInner,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
          isDesktop && styles.heroInnerDesktop,
        ]}>
        <View style={[styles.copyBlock, isDesktop && styles.copyBlockDesktop]}>
          <ThemedText
            type="title"
            accessibilityRole="header"
            style={[styles.heading, isDesktop && styles.headingDesktop]}>
            Välkommen till SeniorHub
          </ThemedText>
          <ThemedText type="bodyLarge" style={styles.subtitle}>
            Hitta aktiviteter, träffa nya vänner och upptäck vad som händer nära dig.
          </ThemedText>

          <View style={[styles.actions, isTablet && styles.actionsRow]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Utforska aktiviteter"
              onPress={onExplorePress}
              style={({ pressed }) => [
                styles.primaryButton,
                CardShadow,
                pressed && styles.buttonPressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                Utforska aktiviteter
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Logga in"
              onPress={onLoginPress}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.secondaryButtonText}>
                Logga in
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skapa konto"
              onPress={onCreateAccountPress}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.secondaryButtonText}>
                Skapa konto
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.illustration,
            SoftShadow,
            { backgroundColor: theme.primaryLight },
            isDesktop && styles.illustrationDesktop,
          ]}
          accessibilityRole="image"
          accessibilityLabel="Illustration av seniorer som deltar i aktiviteter tillsammans">
          <View style={styles.illustrationBadge}>
            <ThemedText style={styles.illustrationBadgeText}>SeniorHub</ThemedText>
          </View>
          <View style={styles.illustrationIcons}>
            <ThemedText style={styles.illustrationEmoji}>☕</ThemedText>
            <ThemedText style={styles.illustrationEmoji}>🚶</ThemedText>
            <ThemedText style={styles.illustrationEmoji}>🎲</ThemedText>
            <ThemedText style={styles.illustrationEmoji}>🎵</ThemedText>
          </View>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.illustrationCaption}>
            Gemenskap, glädje och aktiviteter nära dig
          </ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.three,
  },
  heroInner: {
    gap: Spacing.five,
  },
  heroInnerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.six,
  },
  copyBlock: {
    gap: Spacing.four,
  },
  copyBlockDesktop: {
    flex: 1,
    maxWidth: 560,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 42,
  },
  headingDesktop: {
    fontSize: 44,
    lineHeight: 52,
  },
  subtitle: {
    color: '#C6DCF0',
    maxWidth: 560,
    fontSize: 22,
    lineHeight: 32,
  },
  actions: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#004E87',
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  illustration: {
    borderRadius: Radius.lg,
    padding: Spacing.five,
    gap: Spacing.four,
    alignItems: 'center',
    minHeight: 220,
    justifyContent: 'center',
  },
  illustrationDesktop: {
    flex: 1,
    maxWidth: 420,
    minHeight: 280,
  },
  illustrationBadge: {
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  illustrationBadgeText: {
    color: '#004E87',
    fontWeight: '700',
    fontSize: 18,
  },
  illustrationIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  illustrationEmoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  illustrationCaption: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
