import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Activity } from '@/constants/activities';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getActivityRegistrationDisplay } from '@/utils/activity-registration';

type ActivityRegistrationStatusProps = {
  activity: Activity;
  variant?: 'card' | 'detail';
  /** Live booked count from registrations (status "registered"). */
  bookedCount?: number;
};

function isFullLine(line: string): boolean {
  return line.includes('Fullbokad') || line.startsWith('🔴');
}

function isSeatsLine(line: string): boolean {
  return line.includes('platser kvar') || line === 'Obegränsat antal platser';
}

function isMembershipLine(line: string): boolean {
  return line.startsWith('🔒');
}

export function ActivityRegistrationStatus({
  activity,
  variant = 'card',
  bookedCount,
}: ActivityRegistrationStatusProps) {
  const theme = useTheme();
  const status = getActivityRegistrationDisplay(activity, { bookedCount });

  if (status.kind === 'hidden') {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        variant === 'detail' && styles.containerDetail,
        status.isFull && { backgroundColor: theme.backgroundElement },
      ]}
      accessibilityLabel={status.lines.join('. ')}>
      {status.lines.map((line) => (
        <ThemedText
          key={line}
          type="bodyLarge"
          themeColor={
            isFullLine(line) ? 'favorite' : isSeatsLine(line) ? 'textSecondary' : undefined
          }
          style={[
            styles.lineText,
            isMembershipLine(line) && styles.membershipLine,
            isFullLine(line) && styles.fullText,
          ]}>
          {line}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  containerDetail: {
    gap: Spacing.two,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  lineText: {
    fontWeight: '700',
  },
  membershipLine: {
    letterSpacing: 0.1,
  },
  fullText: {
    letterSpacing: 0.2,
  },
});
