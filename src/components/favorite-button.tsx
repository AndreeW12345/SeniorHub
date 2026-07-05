import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { useFavorites } from '@/contexts/favorites-context';
import { useTheme } from '@/hooks/use-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FavoriteButtonProps = {
  activityId: string;
  size?: 'medium' | 'large';
};

/** Short bounce animation when toggling a favorite. */
function playFavoriteAnimation(scale: SharedValue<number>) {
  scale.value = withSequence(
    withSpring(1.22, { damping: 9, stiffness: 320 }),
    withSpring(1, { damping: 14, stiffness: 260 }),
  );
}

export function FavoriteButton({ activityId, size = 'medium' }: FavoriteButtonProps) {
  const theme = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(activityId);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonSize = size === 'large' ? 56 : 48;
  const iconSize = size === 'large' ? 28 : 24;

  const handlePress = () => {
    playFavoriteAnimation(scale);
    toggleFavorite(activityId);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Ta bort från favoriter' : 'Spara som favorit'}
      accessibilityState={{ selected: saved }}
      hitSlop={12}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        animatedStyle,
        {
          width: buttonSize,
          height: buttonSize,
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
        },
        pressed && styles.pressed,
      ]}>
      <Ionicons
        name={saved ? 'heart' : 'heart-outline'}
        size={iconSize}
        color={saved ? theme.favorite : theme.textSecondary}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
});
