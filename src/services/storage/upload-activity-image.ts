import * as ImageManipulator from 'expo-image-manipulator';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

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

/**
 * Uploads a local image file to Firebase Storage and returns its download URL.
 *
 * Uses base64 + uploadString instead of fetch→blob→uploadBytes, which hangs
 * silently on React Native / Expo with the Firebase JS SDK.
 */
export async function uploadActivityImage(
  localUri: string,
  activityId?: string,
): Promise<UploadActivityImageResult> {
  console.log('[SeniorHub][upload] start', { hasUri: Boolean(localUri), activityId });

  if (!isFirebaseStorageConfigured()) {
    console.log('[SeniorHub][upload] stop: Storage not configured');
    return {
      ok: false,
      errorMessage: 'Firebase Storage är inte konfigurerat. Kontrollera storageBucket i .env.',
    };
  }

  const storage = getFirebaseStorage();
  if (!storage) {
    console.log('[SeniorHub][upload] stop: Storage init failed');
    return { ok: false, errorMessage: 'Firebase Storage kunde inte initieras.' };
  }

  try {
    console.log('[SeniorHub][upload] before compress');
    const compressed = await compressActivityImage(localUri);
    console.log('[SeniorHub][upload] after compress', {
      hasUri: Boolean(compressed.uri),
      hasBase64: Boolean(compressed.base64),
      base64Length: compressed.base64?.length ?? 0,
    });

    if (!compressed.base64) {
      return { ok: false, errorMessage: 'Kunde inte läsa den valda bilden.' };
    }

    const path = buildStoragePath(activityId);
    const storageRef = ref(storage, path);
    console.log('[SeniorHub][upload] before uploadString', { path });

    // Avoid uploadBytes(blob): known hang on RN/Expo with Firebase JS SDK.
    await uploadString(storageRef, compressed.base64, 'base64', {
      contentType: 'image/jpeg',
    });
    console.log('[SeniorHub][upload] after uploadString');

    console.log('[SeniorHub][upload] before getDownloadURL');
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('[SeniorHub][upload] after getDownloadURL', {
      hasUrl: Boolean(downloadUrl),
    });

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
