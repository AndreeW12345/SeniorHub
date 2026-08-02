import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const WAITLIST_INFO_TEXT =
  'Du står nu i väntelistan. Om någon avbokar flyttas du automatiskt upp i kön. När du får en plats skickar vi en notis till dig.';

/** Light blue tip explaining how the waitlist works for the current user. */
export function WaitlistInfoBanner() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.primaryLight,
          borderColor: theme.border,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={WAITLIST_INFO_TEXT}>
      <View style={[styles.iconCircle, { backgroundColor: theme.card }]}>
        <SymbolView
          tintColor={theme.primary}
          name={{
            ios: 'info.circle.fill',
            android: 'info',
            web: 'info',
          }}
          size={22}
        />
      </View>
      <ThemedText type="bodyLarge" themeColor="text" style={styles.text}>
        {WAITLIST_INFO_TEXT}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 32,
  },
});
