import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';

type ScreenLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Optional sticky footer rendered below the scroll area (e.g. save button). */
  footer?: ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** When true, omits tab-bar inset (useful for stack screens with a sticky footer). */
  omitTabInset?: boolean;
};

const FooterShadow = Platform.select({
  ios: {
    shadowColor: '#004E87',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: {
    elevation: 8,
  },
  web: {
    boxShadow: '0 -6px 24px rgba(0, 78, 135, 0.08)',
  },
  default: {},
});

export function ScreenLayout({
  title,
  subtitle,
  children,
  footer,
  scrollable = true,
  contentStyle,
  omitTabInset = false,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, sectionGap, contentWidth } = useResponsive();
  const tabInset = omitTabInset ? 0 : BottomTabInset;
  const paddingBottom = footer ? Spacing.four : insets.bottom + tabInset + Spacing.six;

  const contentStyles = [
    {
      paddingHorizontal: horizontalPadding,
      paddingTop: sectionGap,
      maxWidth: contentWidth,
      gap: sectionGap,
    },
    contentStyle,
  ];

  const footerBar = footer ? (
    <View
      style={[
        styles.footer,
        FooterShadow,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.three),
          paddingHorizontal: horizontalPadding,
        },
      ]}>
      <View style={[styles.footerInner, { maxWidth: contentWidth }]}>{footer}</View>
    </View>
  ) : null;

  if (!scrollable) {
    return (
      <ThemedView style={styles.container}>
        <ScreenHeader title={title} subtitle={subtitle} />
        <View style={[styles.staticContent, { paddingBottom }, ...contentStyles]}>{children}</View>
        {footerBar}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title={title} subtitle={subtitle} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom }, ...contentStyles]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footerBar}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(217, 226, 236, 0.95)',
    backgroundColor: '#FFFFFF',
    paddingTop: Spacing.three,
  },
  footerInner: {
    width: '100%',
    gap: Spacing.three,
  },
});
