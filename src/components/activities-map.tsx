import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getActivityDisplayLocation, type Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_MAP_REGION } from '@/utils/activity-coordinates';

type ActivitiesMapProps = {
  activities: Activity[];
};

export function ActivitiesMap({ activities }: ActivitiesMapProps) {
  const theme = useTheme();
  const router = useRouter();
  const mapRef = useRef<InstanceType<typeof MapView>>(null);

  const coordinates = useMemo(
    () =>
      activities.map((activity) => ({
        activity,
        latitude: activity.latitude!,
        longitude: activity.longitude!,
      })),
    [activities],
  );

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
        edgePadding: { top: 80, right: 48, bottom: 120, left: 48 },
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
        accessibilityLabel="Karta med aktiviteter">
        {coordinates.map(({ activity, latitude, longitude }) => (
          <Marker
            key={activity.id}
            coordinate={{ latitude, longitude }}
            title={activity.title}
            description={getActivityDisplayLocation(activity)}
            pinColor={theme.primary}
            onCalloutPress={() => router.push(`/activity/${activity.id}` as Href)}
            onPress={() => router.push(`/activity/${activity.id}` as Href)}
          />
        ))}
      </MapView>

      {coordinates.length === 0 ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <ThemedView type="card" style={[styles.emptyCard, CardShadow]}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              Inga kartpositioner ännu
            </ThemedText>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
              Aktiviteter med latitud och longitud visas här. Lägg till koordinater när du skapar
              eller redigerar en aktivitet.
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
