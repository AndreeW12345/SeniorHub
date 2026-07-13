import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useMemberships } from '@/contexts/memberships-context';
import { useTheme } from '@/hooks/use-theme';
import {
  getActivityMembershipOrganization,
  getActivityMembershipUrl,
  isActivityMembershipRequired,
} from '@/utils/activity-registration';

type ActivityMembershipActionsProps = {
  activity: Activity;
};

export function ActivityMembershipActions({ activity }: ActivityMembershipActionsProps) {
  const theme = useTheme();
  const { isMember, markAsMember } = useMemberships();

  if (!isActivityMembershipRequired(activity)) {
    return null;
  }

  const organization = getActivityMembershipOrganization(activity);
  const membershipUrl = getActivityMembershipUrl(activity);

  if (!organization) {
    return null;
  }

  const member = isMember(organization);

  if (member) {
    return (
      <View
        style={[styles.memberBanner, CardShadow, { backgroundColor: theme.primaryLight }]}
        accessibilityLabel={`Du är medlem i ${organization}. Du kan nu anmäla dig till aktiviteten.`}>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.memberTitle}>
          ✅ Du är medlem i {organization}
        </ThemedText>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.memberSubtitle}>
          Du kan nu anmäla dig till aktiviteten.
        </ThemedText>
      </View>
    );
  }

  const openMembershipUrl = () => {
    if (membershipUrl) {
      void Linking.openURL(membershipUrl);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={openMembershipUrl}
        accessibilityRole="button"
        accessibilityLabel={`Bli medlem hos ${organization}`}
        disabled={!membershipUrl}
        style={({ pressed }) => [
          styles.membershipButton,
          { backgroundColor: theme.card, borderColor: theme.primary },
          pressed && styles.pressed,
          !membershipUrl && styles.disabled,
        ]}>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.buttonText}>
          Bli medlem hos {organization}
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => markAsMember(organization)}
        accessibilityRole="button"
        accessibilityLabel={`Markera att du är medlem i ${organization}`}
        style={({ pressed }) => [pressed && styles.pressed]}>
        <ThemedText type="linkPrimary" style={styles.alreadyMemberLink}>
          Jag är redan medlem
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
  membershipButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    alignSelf: 'stretch',
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
  buttonText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  alreadyMemberLink: {
    textAlign: 'center',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
