import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

type SummaryStat = {
  icon: string;
  label: string;
  value: number;
  href: Href;
  accessibilityLabel: string;
};

type HomeQuickSummaryProps = {
  upcomingBookings: number;
  favoriteCount: number;
  unreadNotifications: number;
};

export function HomeQuickSummary({
  upcomingBookings,
  favoriteCount,
  unreadNotifications,
}: HomeQuickSummaryProps) {
  const theme = useTheme();
  const router = useRouter();
  const { isTablet, isDesktop } = useResponsive();

  const stats: SummaryStat[] = [
    {
      icon: '🎫',
      label: 'Kommande bokningar',
      value: upcomingBookings,
      href: '/mina-bokningar' as Href,
      accessibilityLabel: `${upcomingBookings} kommande bokningar`,
    },
    {
      icon: '❤️',
      label: 'Favoriter',
      value: favoriteCount,
      href: '/favoriter' as Href,
      accessibilityLabel: `${favoriteCount} favoritaktiviteter`,
    },
    {
      icon: '🔔',
      label: 'Olästa notiser',
      value: unreadNotifications,
      href: '/notiser' as Href,
      accessibilityLabel: `${unreadNotifications} olästa notiser`,
    },
  ];

  return (
    <View style={styles.section}>
      <ThemedText type="sectionTitle" accessibilityRole="header">
        Din översikt
      </ThemedText>
      <View style={[styles.grid, (isTablet || isDesktop) && styles.gridRow]}>
        {stats.map((stat) => (
          <Pressable
            key={stat.label}
            accessibilityRole="button"
            accessibilityLabel={stat.accessibilityLabel}
            onPress={() => router.push(stat.href)}
            style={({ pressed }) => [
              styles.card,
              CardShadow,
              { backgroundColor: theme.card },
              (isTablet || isDesktop) && styles.cardFlex,
              pressed && styles.cardPressed,
            ]}>
            <ThemedText style={styles.icon}>{stat.icon}</ThemedText>
            <ThemedText type="title" style={styles.value}>
              {stat.value}
            </ThemedText>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.label}>
              {stat.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.four,
  },
  grid: {
    gap: Spacing.three,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
    minHeight: 132,
    justifyContent: 'center',
  },
  cardFlex: {
    flex: 1,
    minWidth: 0,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  icon: {
    fontSize: 28,
    lineHeight: 34,
  },
  value: {
    fontSize: 36,
    lineHeight: 42,
    color: '#004E87',
  },
  label: {
    fontSize: 18,
    lineHeight: 26,
  },
});
