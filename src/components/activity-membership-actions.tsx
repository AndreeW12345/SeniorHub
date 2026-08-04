import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useMemberships } from '@/contexts/memberships-context';
import { useOrganizations } from '@/contexts/organizations-context';
import { useTheme } from '@/hooks/use-theme';
import { normalizeWebsiteUrl } from '@/utils/organizer-links';
import {
  getActivityMembershipOrganization,
  getActivityMembershipUrl,
  isActivityMembershipRequired,
  isActivityRegistrationRequired,
} from '@/utils/activity-registration';

type ActivityMembershipActionsProps = {
  activity: Activity;
};

export function ActivityMembershipActions({ activity }: ActivityMembershipActionsProps) {
  const theme = useTheme();
  const { isMember, markAsMember } = useMemberships();
  const { getOrganizationById } = useOrganizations();
  const hostOrganization = getOrganizationById(activity.organizationId);

  if (!isActivityMembershipRequired(activity)) {
    return null;
  }

  const organization = getActivityMembershipOrganization(activity, hostOrganization);
  const membershipUrl = getActivityMembershipUrl(activity, hostOrganization);

  if (!organization) {
    return null;
  }

  const member = isMember(organization);
  const registrationRequired = isActivityRegistrationRequired(activity);

  if (member) {
    const subtitle = registrationRequired
      ? 'Du kan nu anmäla dig till aktiviteten.'
      : 'Du kan nu delta i aktiviteten.';

    return (
      <View
        style={[styles.memberBanner, CardShadow, { backgroundColor: theme.primaryLight }]}
        accessibilityLabel={`Du är medlem i ${organization}. ${subtitle}`}>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.memberTitle}>
          ✅ Du är medlem i {organization}
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.memberSubtitle}>
          {subtitle}
        </ThemedText>
      </View>
    );
  }

  const openMembershipUrl = () => {
    if (!membershipUrl) {
      return;
    }

    void Linking.openURL(normalizeWebsiteUrl(membershipUrl));
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => markAsMember(organization)}
        accessibilityRole="button"
        accessibilityLabel={`Markera att du är medlem i ${organization}`}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: theme.primary },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
          Jag är medlem
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={openMembershipUrl}
        accessibilityRole="button"
        accessibilityLabel={`Bli medlem i ${organization}`}
        disabled={!membershipUrl}
        style={({ pressed }) => [
          styles.secondaryButton,
          { backgroundColor: theme.card, borderColor: theme.primary },
          pressed && styles.pressed,
          !membershipUrl && styles.disabled,
        ]}>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.secondaryButtonText}>
          Bli medlem
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    alignSelf: 'stretch',
  },
  secondaryButtonText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  memberBanner: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  memberTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  memberSubtitle: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 30,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
