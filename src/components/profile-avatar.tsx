import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/hooks/use-theme';

const AVATAR_SIZE = 112;

type ProfileAvatarProps = {
  photoUrl?: string | null;
  size?: number;
};

/** Round profile photo with a person icon fallback. */
export function ProfileAvatar({ photoUrl, size = AVATAR_SIZE }: ProfileAvatarProps) {
  const theme = useTheme();

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.border,
          },
        ]}
        contentFit="cover"
        accessibilityLabel="Profilbild"
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.primaryLight,
          borderColor: theme.border,
        },
      ]}
      accessibilityLabel="Standardprofilbild">
      <SymbolView
        tintColor={theme.primary}
        name={{ ios: 'person.fill', android: 'person', web: 'person' }}
        size={Math.round(size * 0.42)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 2,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
