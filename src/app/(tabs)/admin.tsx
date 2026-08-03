import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AdminActivityListItem } from '@/components/admin-activity-list-item';
import { AdminGuard } from '@/components/admin-guard';
import { FormRadioGroup } from '@/components/form-radio-group';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import type { AdminActivityScope } from '@/constants/admin-account';
import { type Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { fetchActivitiesFromFirestore } from '@/services/activities';
import { useActivities } from '@/contexts/activities-context';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { filterActivitiesForAdminScope } from '@/utils/activity-organization';

export default function AdminScreen() {
  return (
    <AdminGuard>
      <AdminScreenContent />
    </AdminGuard>
  );
}

function AdminScreenContent() {
  const router = useRouter();
  const theme = useTheme();
  const { user, adminAccount, isSuperAdmin, signOut } = useAuth();
  const { refreshActivities } = useActivities();
  const { saved, updated } = useLocalSearchParams<{ saved?: string; updated?: string }>();
  const successMessage =
    saved === '1'
      ? 'Aktiviteten sparades.'
      : updated === '1'
        ? 'Aktiviteten uppdaterades.'
        : null;
  const [adminActivities, setAdminActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityScope, setActivityScope] = useState<AdminActivityScope>('mine');

  const loadAdminActivities = useCallback(async () => {
    setIsLoading(true);

    try {
      const activities = await fetchActivitiesFromFirestore();
      setAdminActivities(activities);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAdminActivities();
    }, [loadAdminActivities]),
  );

  const visibleActivities = useMemo(
    () => filterActivitiesForAdminScope(adminActivities, adminAccount, activityScope),
    [adminActivities, adminAccount, activityScope],
  );

  const handleActivityDeleted = useCallback(
    (activityId: string) => {
      setAdminActivities((currentActivities) =>
        currentActivities.filter((activity) => activity.id !== activityId),
      );
      void refreshActivities();
    },
    [refreshActivities],
  );

  const handleSignOut = useCallback(async () => {
    const result = await signOut();
    if (!result.ok) {
      return;
    }
    router.replace('/login' as Href);
  }, [router, signOut]);

  const handleScopeChange = useCallback(
    (nextScope: AdminActivityScope) => {
      if (nextScope === 'all' && !isSuperAdmin) {
        return;
      }
      setActivityScope(nextScope);
    },
    [isSuperAdmin],
  );

  const scopeOptions = useMemo(() => {
    const options: { value: AdminActivityScope; label: string }[] = [
      { value: 'mine', label: 'Mina aktiviteter' },
    ];

    if (isSuperAdmin) {
      options.push({ value: 'all', label: 'Alla aktiviteter' });
    }

    return options;
  }, [isSuperAdmin]);

  const listTitle = activityScope === 'all' && isSuperAdmin ? 'Alla aktiviteter' : 'Mina aktiviteter';

  return (
    <ScreenLayout title="Administratör" subtitle="Hantera aktiviteter i Firestore">
      {successMessage ? (
        <View style={[styles.successBanner, CardShadow, { backgroundColor: theme.primaryLight }]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.successText}>
            {successMessage}
          </ThemedText>
        </View>
      ) : null}

      {!adminAccount ? (
        <View style={[styles.warningBanner, CardShadow, { backgroundColor: '#FFF7E8' }]}>
          <ThemedText type="bodyLarge" style={styles.warningText}>
            Ditt adminkonto saknar organisationskoppling. Kontakta en superadmin för att koppla
            organizationId i Firestore-samlingen admins.
          </ThemedText>
        </View>
      ) : null}

      <FormRadioGroup
        label="Visa aktiviteter"
        value={isSuperAdmin ? activityScope : 'mine'}
        options={scopeOptions}
        onChange={handleScopeChange}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Lägg till aktivitet"
        onPress={() => router.push('/admin/add-activity')}
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: theme.primary },
          pressed && styles.addButtonPressed,
        ]}>
        <ThemedText type="bodyLarge" style={styles.addButtonText}>
          Lägg till aktivitet
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Statistik"
        onPress={() => router.push('/admin/statistics' as Href)}
        style={({ pressed }) => [
          styles.statsButton,
          { borderColor: theme.primary, backgroundColor: theme.background },
          pressed && styles.addButtonPressed,
        ]}>
        <ThemedText type="bodyLarge" themeColor="primary" style={styles.statsButtonText}>
          📊 Statistik
        </ThemedText>
      </Pressable>

      <View style={styles.listSection}>
        <ThemedText type="sectionTitle">{listTitle}</ThemedText>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="bodyLarge" themeColor="textSecondary">
              Laddar aktiviteter...
            </ThemedText>
          </View>
        ) : visibleActivities.length > 0 ? (
          <View style={styles.list}>
            {visibleActivities.map((activity) => (
              <AdminActivityListItem
                key={activity.id}
                activity={activity}
                onDeleted={handleActivityDeleted}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, CardShadow, { backgroundColor: theme.card }]}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              Inga aktiviteter att visa
            </ThemedText>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
              {adminAccount
                ? 'Lägg till en aktivitet med knappen ovan.'
                : 'Koppla en organisation till ditt adminkonto för att se aktiviteter.'}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.accountSection}>
        {user?.email ? (
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.accountEmail}>
            Inloggad som {user.email}
          </ThemedText>
        ) : null}

        {adminAccount?.organizationId ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.accountEmail}>
            Organisation: {adminAccount.organizationId}
            {isSuperAdmin ? ' · Superadmin' : ''}
          </ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Logga ut"
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [
            styles.signOutButton,
            { borderColor: theme.border },
            pressed && styles.signOutButtonPressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.signOutButtonText}>
            Logga ut
          </ThemedText>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  successText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  warningBanner: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  warningText: {
    color: '#8A5A00',
    fontWeight: '600',
    lineHeight: 30,
    textAlign: 'center',
  },
  addButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statsButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  statsButtonText: {
    fontWeight: '700',
  },
  listSection: {
    gap: Spacing.four,
  },
  list: {
    gap: Spacing.four,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.four,
  },
  emptyState: {
    borderRadius: Radius.xl,
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.three,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 340,
  },
  accountSection: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  accountEmail: {
    textAlign: 'center',
  },
  signOutButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    alignSelf: 'stretch',
  },
  signOutButtonPressed: {
    opacity: 0.85,
  },
  signOutButtonText: {
    fontWeight: '600',
  },
});
