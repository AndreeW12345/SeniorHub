import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getFirebaseStorage, isFirebaseStorageConfigured } from '@/firebase';
import { compressActivityImage } from '@/services/storage/upload-activity-image';

export type UploadOrganizationLogoResult =
  | { ok: true; downloadUrl: string }
  | { ok: false; errorMessage: string };

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

/** Uploads an organization logo to Firebase Storage. */
export async function uploadOrganizationLogo(
  localUri: string,
  organizationId: string,
): Promise<UploadOrganizationLogoResult> {
  if (!isFirebaseStorageConfigured()) {
    return { ok: false, errorMessage: 'Firebase Storage är inte konfigurerat.' };
  }

  const storage = getFirebaseStorage();
  if (!storage) {
    return { ok: false, errorMessage: 'Firebase Storage kunde inte initieras.' };
  }

  const trimmedOrgId = organizationId.trim();
  if (!trimmedOrgId) {
    return { ok: false, errorMessage: 'Organisationen kunde inte hittas.' };
  }

  try {
    const compressed = await compressActivityImage(localUri);
    if (!compressed.uri) {
      return { ok: false, errorMessage: 'Kunde inte förbereda logotypen för uppladdning.' };
    }

    const path = `organizations/${trimmedOrgId}/logo.jpg`;
    const storageRef = ref(storage, path);
    const blob = await uriToBlob(compressed.uri);
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });
    const downloadUrl = await getDownloadURL(storageRef);
    return { ok: true, downloadUrl };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte ladda upp logotypen.',
    };
  }
}
