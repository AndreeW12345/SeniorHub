import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActivityImagePlaceholder } from '@/components/activity-image-placeholder';
import { Activity, hasActivityImage } from '@/constants/activities';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActivityImageProps = {
  activity: Activity;
  height: number;
  rounded?: boolean;
};

/** Shows the activity photo or a category-based placeholder when missing/failed. */
export function ActivityImage({ activity, height, rounded = false }: ActivityImageProps) {
  const theme = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !hasActivityImage(activity) || imageFailed;

  if (showPlaceholder) {
    return (
      <View style={rounded && styles.rounded}>
        <ActivityImagePlaceholder category={activity.category} height={height} />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, rounded && styles.rounded]}>
      <Image
        source={{ uri: activity.imageUrl! }}
        style={[styles.image, { height }]}
        contentFit="cover"
        transition={300}
        accessibilityIgnoresInvertColors
        onError={() => setImageFailed(true)}
      />
      <View style={[styles.overlay, { backgroundColor: theme.imageOverlay }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  rounded: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});
