import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showErrorAlert } from '@/utils/confirm-alert';

type AdminActivityImagePickerProps = {
  imageUrl: string;
  localImageUri: string | null;
  onImageUrlChange: (url: string) => void;
  onLocalImageUriChange: (uri: string | null) => void;
  disabled?: boolean;
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
}: AdminActivityImagePickerProps) {
  const theme = useTheme();
  const previewUri = getPreviewUri(imageUrl, localImageUri);
  const hasImage = previewUri !== null;

  const handlePickImage = async () => {
    if (disabled) {
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
    onLocalImageUriChange(null);
    onImageUrlChange('');
  };

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Aktivitetsbild (valfri)
      </ThemedText>

      {hasImage ? (
        <View style={[styles.previewCard, CardShadow, { backgroundColor: theme.card }]}>
          <Image
            source={{ uri: previewUri }}
            style={styles.previewImage}
            contentFit="cover"
            transition={200}
            accessibilityLabel="Förhandsvisning av vald aktivitetsbild"
          />
          <View style={styles.previewActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Byt bild"
              disabled={disabled}
              onPress={() => void handlePickImage()}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.primary },
                (pressed || disabled) && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                Byt bild
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ta bort bild"
              disabled={disabled}
              onPress={handleRemoveImage}
              style={({ pressed }) => [
                styles.actionButton,
                styles.secondaryButton,
                { borderColor: theme.border },
                (pressed || disabled) && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.secondaryButtonText}>
                Ta bort bild
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Välj bild från enheten"
          disabled={disabled}
          onPress={() => void handlePickImage()}
          style={({ pressed }) => [
            styles.emptyState,
            CardShadow,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
            (pressed || disabled) && styles.pressed,
          ]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
            <SymbolView
              tintColor={theme.primary}
              name={{ ios: 'photo.on.rectangle.angled', android: 'image', web: 'image' }}
              size={32}
            />
          </View>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.emptyTitle}>
            Välj bild
          </ThemedText>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
            Tryck här för att välja en bild från din enhet.
          </ThemedText>
        </Pressable>
      )}

      {disabled ? (
        <View style={styles.uploadingRow}>
          <ActivityIndicator color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Laddar upp bild...
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  previewCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: Radius.lg,
  },
  previewActions: {
    gap: Spacing.three,
  },
  actionButton: {
    minHeight: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
  emptyState: {
    minHeight: 220,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 320,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.88,
  },
});
