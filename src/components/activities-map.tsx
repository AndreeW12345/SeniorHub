import * as Location from 'expo-location';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { MapActivityPreviewCard } from '@/components/map-activity-preview-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { hasActivityCoordinates, type Activity } from '@/constants/activities';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_MAP_REGION } from '@/utils/activity-coordinates';
import {
  getMapLocationAccessBanner,
  type MapLocationAccessBanner,
} from '@/utils/map-location-permission';

type ActivitiesMapProps = {
  activities: Activity[];
};

type MapCoordinate = {
  activity: Activity;
  latitude: number;
  longitude: number;
};

type MapLatLng = {
  latitude: number;
  longitude: number;
};

const MAP_FIT_PADDING = { top: 80, right: 48, bottom: 180, left: 48 } as const;
const OPENSTREETMAP_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';

function fitMapViewToCoordinates(
  map: MapView,
  points: MapLatLng[],
): void {
  if (points.length === 0) {
    return;
  }

  if (points.length === 1) {
    map.animateToRegion(
      {
        latitude: points[0].latitude,
        longitude: points[0].longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      350,
    );
    return;
  }

  map.fitToCoordinates(points, {
    edgePadding: MAP_FIT_PADDING,
    animated: true,
  });
}

export function ActivitiesMap({ activities }: ActivitiesMapProps) {
  const theme = useTheme();
  const router = useRouter();
  const mapRef = useRef<InstanceType<typeof MapView>>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationBanner, setLocationBanner] = useState<MapLocationAccessBanner>('none');
  const [userPosition, setUserPosition] = useState<MapLatLng | null>(null);

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

  const markerPoints = useMemo(
    () => coordinates.map(({ latitude, longitude }) => ({ latitude, longitude })),
    [coordinates],
  );

  const selectedActivity = useMemo(
    () => coordinates.find((entry) => entry.activity.id === selectedActivityId)?.activity ?? null,
    [coordinates, selectedActivityId],
  );

  const refreshUserPosition = useCallback(async (): Promise<MapLatLng | null> => {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (
        !Number.isFinite(position.coords.latitude) ||
        !Number.isFinite(position.coords.longitude)
      ) {
        return null;
      }

      const next = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setUserPosition(next);
      return next;
    } catch (error) {
      console.warn('[SeniorHub] Kunde inte hämta aktuell position för kartan:', error);
      return null;
    }
  }, []);

  const ensureForegroundLocationAccess = useCallback(async () => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      let permission = await Location.getForegroundPermissionsAsync();

      if (!permission.granted && permission.canAskAgain !== false) {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      const banner = getMapLocationAccessBanner(permission);
      setLocationBanner(banner);
      setLocationGranted(permission.granted);

      if (permission.granted) {
        const position = await refreshUserPosition();
        const map = mapRef.current;
        if (map) {
          const fitPoints = [...markerPoints];
          if (position) {
            fitPoints.push(position);
          }
          fitMapViewToCoordinates(map, fitPoints);
        }
      } else {
        setUserPosition(null);
      }
    } catch (error) {
      console.warn('[SeniorHub] Karta platsbehörighet misslyckades:', error);
      setLocationGranted(false);
      setLocationBanner('denied');
      setUserPosition(null);
    }
  }, [markerPoints, refreshUserPosition]);

  useFocusEffect(
    useCallback(() => {
      void ensureForegroundLocationAccess();
    }, [ensureForegroundLocationAccess]),
  );

  useEffect(() => {
    if (selectedActivityId && !coordinates.some((entry) => entry.activity.id === selectedActivityId)) {
      setSelectedActivityId(null);
    }
  }, [coordinates, selectedActivityId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const fitPoints = [...markerPoints];
    if (locationGranted && userPosition) {
      fitPoints.push(userPosition);
    }

    if (fitPoints.length === 0) {
      return;
    }

    fitMapViewToCoordinates(map, fitPoints);
  }, [locationGranted, markerPoints, userPosition]);

  const handleOpenLocationSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const handleOpenOsmCopyright = useCallback(() => {
    void Linking.openURL(OPENSTREETMAP_COPYRIGHT_URL);
  }, []);

  const showLocationBanner = locationBanner !== 'none';

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_MAP_REGION}
        showsUserLocation={Platform.OS !== 'web' && locationGranted}
        showsMyLocationButton={Platform.OS === 'android' && locationGranted}
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

      {showLocationBanner ? (
        <View style={styles.locationBannerOverlay} pointerEvents="box-none">
          <ThemedView
            type="card"
            style={[
              styles.locationBanner,
              CardShadow,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.locationBannerText}>
              {locationBanner === 'settings'
                ? Platform.OS === 'ios'
                  ? 'För att se din position på kartan behöver du tillåta platsåtkomst i iPhone-inställningarna under SeniorHub.'
                  : 'För att se din position på kartan behöver du tillåta platsåtkomst i enhetens inställningar för SeniorHub.'
                : 'Aktiviteterna visas som vanligt. Du kan tillåta platsåtkomst för att se din egen position på kartan.'}
            </ThemedText>
            {locationBanner === 'settings' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Öppna inställningar för SeniorHub"
                onPress={handleOpenLocationSettings}
                style={({ pressed }) => [
                  styles.locationBannerButton,
                  { backgroundColor: theme.primaryLight },
                  pressed && styles.locationBannerButtonPressed,
                ]}>
                <ThemedText type="bodyLarge" themeColor="primary">
                  Öppna inställningar
                </ThemedText>
              </Pressable>
            ) : null}
          </ThemedView>
        </View>
      ) : null}

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

      <View style={styles.osmAttributionOverlay} pointerEvents="box-none">
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="OpenStreetMap copyright information"
          onPress={handleOpenOsmCopyright}
          style={({ pressed }) => [
            styles.osmAttribution,
            { backgroundColor: theme.card, borderColor: theme.border },
            pressed && styles.osmAttributionPressed,
          ]}>
          <ThemedText type="small" themeColor="textSecondary">
            © OpenStreetMap-bidragare
          </ThemedText>
        </Pressable>
      </View>
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
  locationBannerOverlay: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.four,
    right: Spacing.four,
  },
  locationBanner: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
    gap: Spacing.three,
  },
  locationBannerText: {
    lineHeight: 28,
  },
  locationBannerButton: {
    alignSelf: 'flex-start',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  locationBannerButtonPressed: {
    opacity: 0.88,
  },
  previewOverlay: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    bottom: Spacing.four,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  osmAttributionOverlay: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
    zIndex: 1,
  },
  osmAttribution: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    opacity: 0.92,
  },
  osmAttributionPressed: {
    opacity: 0.8,
  },
});