import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { MapActivityPreviewCard } from '@/components/map-activity-preview-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { hasActivityCoordinates, type Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_MAP_REGION } from '@/utils/activity-coordinates';

type ActivitiesMapProps = {
  activities: Activity[];
};

type MapCoordinate = {
  activity: Activity;
  latitude: number;
  longitude: number;
};

export function ActivitiesMap({ activities }: ActivitiesMapProps) {
  const theme = useTheme();
  const router = useRouter();
  const mapRef = useRef<InstanceType<typeof MapView>>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const coordinates = useMemo(
    () =>
      activities
        .filter(hasActivityCoordinates)
        .map((activity): MapCoordinate => ({
          activity,
          latitude: activity.latitude as number,
          longitude: activity.longitude as number,
        })),
    [activities],
  );

  const selectedActivity = useMemo(
    () => coordinates.find((entry) => entry.activity.id === selectedActivityId)?.activity ?? null,
    [coordinates, selectedActivityId],
  );

  useEffect(() => {
    if (selectedActivityId && !coordinates.some((entry) => entry.activity.id === selectedActivityId)) {
      setSelectedActivityId(null);
    }
  }, [coordinates, selectedActivityId]);

  useEffect(() => {
    if (coordinates.length === 0 || !mapRef.current) {
      return;
    }

    if (coordinates.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: coordinates[0].latitude,
          longitude: coordinates[0].longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        350,
      );
      return;
    }

    mapRef.current.fitToCoordinates(
      coordinates.map(({ latitude, longitude }) => ({ latitude, longitude })),
      {
        edgePadding: { top: 80, right: 48, bottom: 180, left: 48 },
        animated: true,
      },
    );
  }, [coordinates]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_MAP_REGION}
        showsUserLocation={Platform.OS !== 'web'}
        showsMyLocationButton={Platform.OS === 'android'}
        accessibilityLabel="Karta med aktiviteter"
        onPress={() => setSelectedActivityId(null)}>
        {coordinates.map(({ activity, latitude, longitude }) => (
          <Marker
            key={activity.id}
            coordinate={{ latitude, longitude }}
            pinColor={
              selectedActivityId === activity.id ? theme.favorite : theme.primary
            }
            accessibilityLabel={activity.title}
            onPress={(event) => {
              event.stopPropagation();
              setSelectedActivityId(activity.id);
            }}
          />
        ))}
      </MapView>

      {selectedActivity ? (
        <View style={styles.previewOverlay} pointerEvents="box-none">
          <MapActivityPreviewCard
            activity={selectedActivity}
            onDismiss={() => setSelectedActivityId(null)}
            onViewActivity={() =>
              router.push(`/activity/${selectedActivity.id}` as Href)
            }
          />
        </View>
      ) : null}

      {coordinates.length === 0 ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <ThemedView type="card" style={[styles.emptyCard, CardShadow]}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              Inga kartpositioner ännu
            </ThemedText>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
              Aktiviteter med sparad adress och koordinater visas här på kartan.
            </ThemedText>
          </ThemedView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    bottom: Spacing.four,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  emptyCard: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.five,
    gap: Spacing.three,
    maxWidth: 420,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 32,
  },
});
