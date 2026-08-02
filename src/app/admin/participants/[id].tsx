import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AdminGuard } from '@/components/admin-guard';
import { AdminParticipantsView } from '@/components/admin-participants-view';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { type Activity } from '@/constants/activities';
import { Radius, Spacing } from '@/constants/theme';
import { fetchActivityByIdFromFirestore } from '@/services/activities/fetch-activities';
import { useTheme } from '@/hooks/use-theme';

export default function AdminParticipantsScreen() {
  return (
    <AdminGuard>
      <AdminParticipantsScreenContent />
    </AdminGuard>
  );
}

function AdminParticipantsScreenContent() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadActivity() {
      if (typeof id !== 'string' || !id.trim()) {
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
      <ScreenLayout title="Deltagare" subtitle="Hämtar aktivitet" showBackButton omitTabInset>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Laddar deltagare...
          </ThemedText>
        </View>
      </ScreenLayout>
    );
  }

  if (!activity) {
    return (
      <ScreenLayout title="Deltagare" subtitle="Aktiviteten hittades inte" showBackButton omitTabInset>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Aktiviteten kunde inte hittas. Gå tillbaka till administratörsvyn och försök igen.
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
    <ScreenLayout title="Deltagare" subtitle={activity.title} showBackButton omitTabInset>
      <AdminParticipantsView activityId={activity.id} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.six,
  },
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
