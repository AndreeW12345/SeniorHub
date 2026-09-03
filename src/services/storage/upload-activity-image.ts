import * as ImageManipulator from 'expo-image-manipulator';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getFirebaseStorage, isFirebaseStorageConfigured } from '@/firebase';

const MAX_IMAGE_WIDTH = 1200;
const JPEG_QUALITY = 0.8;

export type UploadActivityImageResult =
  | { ok: true; downloadUrl: string }
  | { ok: false; errorMessage: string };

/** Resizes and compresses a local image before upload. Returns JPEG base64 for Storage. */
export async function compressActivityImage(
  uri: string,
): Promise<{ uri: string; base64?: string }> {
  return ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_IMAGE_WIDTH } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
}

function buildStoragePath(activityId?: string): string {
  if (activityId?.trim()) {
    return `activities/${activityId.trim()}/cover.jpg`;
  }

  return `activities/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
}

/** RN-compatible blob from a local file URI (fetch→blob breaks; uploadString uses unsupported ArrayBuffer blobs). */
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

/**
 * Uploads a local image file to Firebase Storage and returns its download URL.
 *
 * Uses XMLHttpRequest blob + uploadBytes for React Native / Expo compatibility.
 */
export async function uploadActivityImage(
  localUri: string,
  activityId?: string,
): Promise<UploadActivityImageResult> {
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
    const compressed = await compressActivityImage(localUri);

    if (!compressed.uri) {
      return { ok: false, errorMessage: 'Kunde inte läsa den valda bilden.' };
    }

    const path = buildStoragePath(activityId);
    const storageRef = ref(storage, path);
    const blob = await uriToBlob(compressed.uri);
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return { ok: true, downloadUrl };
  } catch (error) {
    console.error('[SeniorHub][upload] failed:', error);
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte ladda upp bilden till Firebase Storage.',
    };
  }
}
