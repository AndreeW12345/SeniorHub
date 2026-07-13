import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Activity } from '@/constants/activities';
import { useMemberships } from '@/contexts/memberships-context';
import {
  getActivityMembershipOrganization,
  getActivityParticipationHelperText,
} from '@/utils/activity-registration';

type ActivityParticipationHelperProps = {
  activity: Activity;
};

export function ActivityParticipationHelper({ activity }: ActivityParticipationHelperProps) {
  const { isMember } = useMemberships();
  const organization = getActivityMembershipOrganization(activity) ?? '';
  const helperText = getActivityParticipationHelperText(activity, isMember(organization));

  if (!helperText) {
    return null;
  }

  return (
    <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.helperText}>
      {helperText}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  helperText: {
    lineHeight: 30,
  },
});
