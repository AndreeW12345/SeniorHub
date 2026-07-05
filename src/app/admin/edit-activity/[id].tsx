import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AdminActivityForm } from '@/components/admin-activity-form';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { type Activity } from '@/constants/activities';
import { Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { fetchActivityByIdFromFirestore } from '@/services/activities/fetch-activities';
import { useTheme } from '@/hooks/use-theme';

export default function EditActivityScreen() {
  const router = useRouter();
  const theme = useTheme();
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
      <ScreenLayout title="Redigera aktivitet" subtitle="Hämtar aktivitet">
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
      <ScreenLayout title="Redigera aktivitet" subtitle="Aktiviteten hittades inte">
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Aktiviteten kunde inte hittas. Gå tillbaka till administratörsvyn och försök igen.
        </ThemedText>
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
      }}
      onSubmitSuccess={async () => {
        await refreshActivities();
        router.replace('/admin?updated=1' as Href);
      }}
    />
  );
}
