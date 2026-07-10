import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivitiesMap } from '@/components/activities-map';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getActivitiesWithCoordinates } from '@/constants/activities';
import { useActivities } from '@/contexts/activities-context';

export default function KartaScreen() {
  const insets = useSafeAreaInsets();
  const { activities } = useActivities();
  const mapActivities = getActivitiesWithCoordinates(activities);
  const subtitle =
    mapActivities.length === 1
      ? '1 aktivitet på kartan'
      : `${mapActivities.length} aktiviteter på kartan`;

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="Karta" subtitle={subtitle} />
      <View style={[styles.mapArea, { paddingBottom: insets.bottom + BottomTabInset }]}>
        <ActivitiesMap activities={mapActivities} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  mapArea: {
    flex: 1,
    minHeight: 0,
    paddingTop: Spacing.three,
  },
});
