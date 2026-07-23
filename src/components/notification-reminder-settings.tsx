import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { NotificationPreferenceRow } from '@/components/notification-preference-row';
import { ThemedText } from '@/components/themed-text';
import { NOTIFICATION_PREFERENCE_OPTIONS } from '@/constants/notification-preferences';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useNotificationPreferences } from '@/contexts/notification-preferences-context';
import { useTheme } from '@/hooks/use-theme';

/** Card with local reminder preference switches for the Notiser screen. */
export function NotificationReminderSettings() {
  const theme = useTheme();
  const { preferences, isLoading, setPreference } = useNotificationPreferences();

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <ThemedText type="sectionTitle" style={styles.title}>
          Påminnelser om aktiviteter
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.subtitle}>
          Välj vilka påminnelser du vill få inför dina bokade aktiviteter.
        </ThemedText>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Laddar inställningar...
          </ThemedText>
        </View>
      ) : (
        <View style={styles.options}>
          {NOTIFICATION_PREFERENCE_OPTIONS.map((option, index) => (
            <View key={option.key}>
              {index > 0 ? (
                <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />
              ) : null}
              <NotificationPreferenceRow
                title={option.title}
                description={option.description}
                value={preferences[option.key]}
                onValueChange={(value) => setPreference(option.key, value)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    letterSpacing: -0.2,
  },
  subtitle: {
    lineHeight: 30,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  options: {
    gap: Spacing.one,
  },
  optionDivider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.three,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
