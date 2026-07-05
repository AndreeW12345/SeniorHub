import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';

type ScreenLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenLayout({
  title,
  subtitle,
  children,
  scrollable = true,
  contentStyle,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, sectionGap, contentWidth } = useResponsive();
  const paddingBottom = insets.bottom + BottomTabInset + Spacing.six;

  const contentStyles = [
    {
      paddingHorizontal: horizontalPadding,
      paddingTop: sectionGap,
      maxWidth: contentWidth,
      gap: sectionGap,
    },
    contentStyle,
  ];

  if (!scrollable) {
    return (
      <ThemedView style={styles.container}>
        <ScreenHeader title={title} subtitle={subtitle} />
        <View style={[styles.staticContent, { paddingBottom }, ...contentStyles]}>{children}</View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title={title} subtitle={subtitle} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom },
          ...contentStyles,
        ]}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
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
});
