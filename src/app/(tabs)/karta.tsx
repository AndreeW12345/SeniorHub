import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

export default function KartaScreen() {
  const theme = useTheme();
  const { isDesktop } = useResponsive();

  return (
    <ScreenLayout title="Karta" subtitle="Aktiveras i en kommande version" scrollable={false}>
      <View
        style={[
          styles.placeholder,
          CardShadow,
          { backgroundColor: theme.card, minHeight: isDesktop ? 420 : 320 },
        ]}>
        <SymbolView
          tintColor={theme.primary}
          name={{ ios: 'map.fill', android: 'map', web: 'map' }}
          size={isDesktop ? 72 : 60}
        />
        <ThemedText type="subtitle" style={styles.placeholderTitle}>
          Karta
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.placeholderText}>
          I den här versionen visas aktiviteter som en lista. Karta läggs till i ett senare steg.
        </ThemedText>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    gap: Spacing.four,
  },
  placeholderTitle: {
    textAlign: 'center',
  },
  placeholderText: {
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 32,
  },
});
