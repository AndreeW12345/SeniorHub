import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AdminActivityForm } from '@/components/admin-activity-form';
import { AdminGuard } from '@/components/admin-guard';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { type Activity } from '@/constants/activities';
import { Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useAuth } from '@/contexts/auth-context';
import { fetchActivityByIdFromFirestore } from '@/services/activities/fetch-activities';
import { useTheme } from '@/hooks/use-theme';
import { canAdminAccessActivity } from '@/utils/activity-organization';

export default function EditActivityScreen() {
  return (
    <AdminGuard>
      <EditActivityScreenContent />
    </AdminGuard>
  );
}

function EditActivityScreenContent() {
  const router = useRouter();
  const theme = useTheme();
  const { adminAccount } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshActivities } = useActivities();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadActivity() {
      if (typeof id !== 'string') {
        setActivity(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const fetchedActivity = await fetchActivityByIdFromFirestore(id);

        if (isMounted) {
          setActivity(fetchedActivity);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadActivity();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <ScreenLayout title="Redigera aktivitet" subtitle="Hämtar aktivitet" showBackButton>
        <View style={{ alignItems: 'center', paddingVertical: Spacing.six, gap: Spacing.four }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Laddar aktivitet...
          </ThemedText>
        </View>
      </ScreenLayout>
    );
  }

  if (!activity) {
    return (
      <ScreenLayout title="Redigera aktivitet" subtitle="Aktiviteten hittades inte" showBackButton>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Aktiviteten kunde inte hittas. Gå tillbaka till administratörsvyn och försök igen.
        </ThemedText>
      </ScreenLayout>
    );
  }

  if (!canAdminAccessActivity(adminAccount, activity)) {
    return (
      <ScreenLayout title="Redigera aktivitet" subtitle="Ingen behörighet" showBackButton>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Du har inte behörighet att redigera denna aktivitet.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tillbaka till admin"
          onPress={() => router.replace('/admin' as Href)}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.primary },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.backButtonText}>
            Tillbaka
          </ThemedText>
        </Pressable>
      </ScreenLayout>
    );
  }

  return (
    <AdminActivityForm
      mode="edit"
      activityId={activity.id}
      initialValues={{
        title: activity.title,
        description: activity.description,
        date: activity.date,
        time: activity.time,
        location: activity.location,
        organizer: activity.organizer,
        category: activity.category,
        imageUrl: activity.imageUrl ?? '',
        latitude: activity.latitude != null ? String(activity.latitude) : '',
        longitude: activity.longitude != null ? String(activity.longitude) : '',
        address: activity.address ?? '',
        registrationRequired: activity.registrationRequired === true,
        hasParticipantLimit: activity.hasParticipantLimit === true,
        maxParticipants:
          activity.maxParticipants != null ? String(activity.maxParticipants) : '',
        participants: activity.participants ?? 0,
        membershipRequired: activity.membershipRequired === true,
        membershipOrganization: activity.membershipOrganization ?? '',
        membershipUrl: activity.membershipUrl ?? '',
        registrationMethod: activity.registrationMethod ?? undefined,
        registrationUrl: activity.registrationUrl ?? '',
        registrationPhone: activity.registrationPhone ?? '',
        registrationEmail: activity.registrationEmail ?? '',
      }}
      onSubmitSuccess={async () => {
        await refreshActivities();
        router.replace('/admin?updated=1' as Href);
      }}
    />
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 56,
    borderRadius: Radius.lg,
    borderWidth: 2,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  backButtonText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
