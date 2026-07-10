import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateDisplay, formatTimeDisplay } from '@/utils/date-time-format';

type ActivityScheduleProps = {
  date: string;
  time: string;
};

/** Prominent date and time block for activity cards. */
export function ActivitySchedule({ date, time }: ActivityScheduleProps) {
  const theme = useTheme();
  const displayDate = formatDateDisplay(date);
  const displayTime = formatTimeDisplay(time);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.primaryLight }]}
      accessibilityLabel={`Datum och tid: ${displayDate}, ${displayTime}`}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: theme.card }]}>
          <SymbolView
            tintColor={theme.primary}
            name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
            size={28}
            weight="medium"
          />
        </View>
        <ThemedText type="subtitle" themeColor="primary" style={styles.dateText}>
          {displayDate}
        </ThemedText>
      </View>

      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: theme.card }]}>
          <SymbolView
            tintColor={theme.primary}
            name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
            size={26}
            weight="medium"
          />
        </View>
        <ThemedText type="sectionTitle" themeColor="primary" style={styles.timeText}>
          {displayTime}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four + 4,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    flex: 1,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  timeText: {
    flex: 1,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
