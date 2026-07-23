import * as ImageManipulator from 'expo-image-manipulator';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

import { getFirebaseStorage, isFirebaseStorageConfigured } from '@/firebase';

const AVATAR_SIZE = 512;
const JPEG_QUALITY = 0.85;

export type UploadProfileImageResult =
  | { ok: true; downloadUrl: string }
  | { ok: false; errorMessage: string };

async function compressProfileImage(uri: string): Promise<{ base64?: string }> {
  return ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: AVATAR_SIZE } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
}

/** Uploads a square profile photo to Firebase Storage. */
export async function uploadProfileImage(
  localUri: string,
  deviceId: string,
): Promise<UploadProfileImageResult> {
  if (!isFirebaseStorageConfigured()) {
    return {
      ok: false,
      errorMessage: 'Firebase Storage är inte konfigurerat. Kontrollera storageBucket i .env.',
    };
  }

  const storage = getFirebaseStorage();
  if (!storage) {
    return { ok: false, errorMessage: 'Firebase Storage kunde inte initieras.' };
  }

  try {
    const compressed = await compressProfileImage(localUri);
    if (!compressed.base64) {
      return { ok: false, errorMessage: 'Kunde inte läsa den valda bilden.' };
    }

    const path = `profiles/${deviceId}/avatar.jpg`;
    const storageRef = ref(storage, path);
    await uploadString(storageRef, compressed.base64, 'base64', {
      contentType: 'image/jpeg',
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return { ok: true, downloadUrl };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte ladda upp profilbild:', error);
    return {
      ok: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Kunde inte ladda upp profilbilden till Firebase Storage.',
    };
  }
}
