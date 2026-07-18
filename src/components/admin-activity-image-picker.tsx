import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { showErrorAlert } from '@/utils/confirm-alert';

type AdminActivityImagePickerProps = {
  imageUrl: string;
  localImageUri: string | null;
  onImageUrlChange: (url: string) => void;
  onLocalImageUriChange: (uri: string | null) => void;
  disabled?: boolean;
  isUploading?: boolean;
};

function getPreviewUri(imageUrl: string, localImageUri: string | null): string | null {
  if (localImageUri) {
    return localImageUri;
  }

  return imageUrl.trim().length > 0 ? imageUrl.trim() : null;
}

export function AdminActivityImagePicker({
  imageUrl,
  localImageUri,
  onImageUrlChange,
  onLocalImageUriChange,
  disabled = false,
  isUploading = false,
}: AdminActivityImagePickerProps) {
  const theme = useTheme();
  const { isCompact, isDesktop } = useResponsive();
  const previewUri = getPreviewUri(imageUrl, localImageUri);
  const hasImage = previewUri !== null;
  const previewHeight = isCompact ? 240 : isDesktop ? 360 : 300;
  const busy = disabled || isUploading;

  const handlePickImage = async () => {
    if (busy) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showErrorAlert(
        'Behörighet saknas',
        'Ge appen tillgång till dina bilder för att kunna välja en aktivitetsbild.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    onLocalImageUriChange(result.assets[0].uri);
  };

  const handleRemoveImage = () => {
    if (busy) {
      return;
    }

    onLocalImageUriChange(null);
    onImageUrlChange('');
  };

  return (
    <View style={styles.container}>
      {hasImage ? (
        <View style={[styles.previewShell, { backgroundColor: theme.backgroundElement }]}>
          <Image
            source={{ uri: previewUri }}
            style={[styles.previewImage, { height: previewHeight }]}
            contentFit="cover"
            transition={200}
            accessibilityLabel="Förhandsvisning av vald aktivitetsbild"
          />
          {isUploading ? (
            <View style={[styles.uploadOverlay, { backgroundColor: 'rgba(16, 42, 67, 0.55)' }]}>
              <ActivityIndicator color="#FFFFFF" size="large" />
              <ThemedText type="bodyLarge" style={styles.uploadOverlayText}>
                Laddar upp bild...
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Välj bild"
          disabled={busy}
          onPress={() => void handlePickImage()}
          style={({ pressed }) => [
            styles.emptyState,
            {
              minHeight: previewHeight,
              backgroundColor: theme.backgroundElement,
              borderColor: theme.primary,
            },
            (pressed || busy) && styles.pressed,
          ]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
            <SymbolView
              tintColor={theme.primary}
              name={{ ios: 'photo.on.rectangle.angled', android: 'image', web: 'image' }}
              size={40}
            />
          </View>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.emptyTitle}>
            Välj bild
          </ThemedText>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
            Lägg till en bild som syns på aktivitetskortet och detaljsidan.
          </ThemedText>
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasImage ? 'Byt bild' : 'Välj bild'}
        disabled={busy}
        onPress={() => void handlePickImage()}
        style={({ pressed }) => [
          styles.primaryButton,
          CardShadow,
          { backgroundColor: theme.primary },
          (pressed || busy) && styles.pressed,
          busy && styles.disabled,
        ]}>
        <SymbolView
          tintColor="#FFFFFF"
          name={{ ios: 'photo', android: 'image', web: 'image' }}
          size={24}
        />
        <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
          {hasImage ? 'Byt bild' : 'Välj bild'}
        </ThemedText>
      </Pressable>

      {hasImage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ta bort bild"
          disabled={busy}
          onPress={handleRemoveImage}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.border, backgroundColor: theme.card },
            (pressed || busy) && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.secondaryButtonText}>
            Ta bort bild
          </ThemedText>
        </Pressable>
      ) : null}

      {localImageUri ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Ny bild vald – den laddas upp när du sparar aktiviteten.
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  previewShell: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  uploadOverlayText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyState: {
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 24,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 30,
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.75,
  },
});
