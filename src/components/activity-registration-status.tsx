import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { WaitlistInfoBanner } from '@/components/waitlist-info-banner';
import type { Activity } from '@/constants/activities';
import { Radius, Spacing } from '@/constants/theme';
import { useOrganizations } from '@/contexts/organizations-context';
import { useTheme } from '@/hooks/use-theme';
import { getActivityRegistrationDisplay } from '@/utils/activity-registration';
import { formatWaitlistPositionLabel } from '@/utils/waitlist';

type ActivityRegistrationStatusProps = {
  activity: Activity;
  variant?: 'card' | 'detail';
  /** Live booked count from registrations (status "registered"). */
  bookedCount?: number;
  /** Live waitlist size. */
  waitlistCount?: number;
  /** 1-based position for the current user on the waitlist. */
  waitlistPosition?: number | null;
  /** Hide membership-required lines when the user has confirmed membership. */
  confirmedMember?: boolean;
};

function isFullLine(line: string): boolean {
  return line === 'Fullbokad' || line.includes('Fullbokad') || line.startsWith('🔴');
}

function isSeatsLine(line: string): boolean {
  return (
    line.includes('platser bokade') ||
    line.includes('platser kvar') ||
    line.includes('plats kvar') ||
    line === 'Obegränsat antal platser' ||
    line.startsWith('Väntelista:')
  );
}

function isMembershipLine(line: string): boolean {
  return line.startsWith('🔒') || line.startsWith('✏️');
}

export function ActivityRegistrationStatus({
  activity,
  variant = 'card',
  bookedCount,
  waitlistCount,
  waitlistPosition,
  confirmedMember = false,
}: ActivityRegistrationStatusProps) {
  const theme = useTheme();
  const { getOrganizationById } = useOrganizations();
  const hostOrganization = getOrganizationById(activity.organizationId);
  const status = getActivityRegistrationDisplay(activity, {
    bookedCount,
    waitlistCount,
    organization: hostOrganization,
    confirmedMember,
  });
  const positionLabel =
    typeof waitlistPosition === 'number' && waitlistPosition > 0
      ? formatWaitlistPositionLabel(waitlistPosition)
      : null;
  const showWaitlistInfo = Boolean(positionLabel);

  if (status.kind === 'hidden' && !positionLabel) {
    return null;
  }

  const lines = status.kind === 'lines' ? status.lines : [];
  const accessibilityParts = [...lines];
  if (positionLabel) {
    accessibilityParts.push(positionLabel);
  }

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          variant === 'detail' && styles.containerDetail,
          status.kind === 'lines' && status.isFull && { backgroundColor: theme.backgroundElement },
        ]}
        accessibilityLabel={accessibilityParts.join('. ')}>
        {lines.map((line) => (
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

        {positionLabel ? (
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.positionText}>
            {positionLabel}
          </ThemedText>
        ) : null}
      </View>

      {showWaitlistInfo ? <WaitlistInfoBanner /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.three,
  },
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
  positionText: {
    fontWeight: '700',
    marginTop: Spacing.one,
  },
});
