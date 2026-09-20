import * as ImageManipulator from 'expo-image-manipulator';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getFirebaseStorage, isFirebaseStorageConfigured } from '@/firebase';

const AVATAR_SIZE = 512;
const JPEG_QUALITY = 0.85;

export type UploadProfileImageResult =
  | { ok: true; downloadUrl: string }
  | { ok: false; errorMessage: string };

async function compressProfileImage(uri: string): Promise<{ uri: string; base64?: string }> {
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

/** RN-compatible blob from a local file URI (uploadString base64 uses unsupported ArrayBuffer blobs). */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/** Uploads a square profile photo to Firebase Storage. */
export async function uploadProfileImage(
  localUri: string,
  userId: string,
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

  const trimmedId = userId.trim();
  if (!trimmedId) {
    return { ok: false, errorMessage: 'Ingen inloggad användare.' };
  }

  try {
    const compressed = await compressProfileImage(localUri);
    if (!compressed.uri) {
      return { ok: false, errorMessage: 'Kunde inte läsa den valda bilden.' };
    }

    const path = `profiles/${trimmedId}/avatar.jpg`;
    const storageRef = ref(storage, path);
    const blob = await uriToBlob(compressed.uri);
    await uploadBytes(storageRef, blob, {
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
