import { getDownloadURL, ref, uploadString } from 'firebase/storage';

import { getFirebaseStorage, isFirebaseStorageConfigured } from '@/firebase';
import { compressActivityImage } from '@/services/storage/upload-activity-image';

export type UploadOrganizationLogoResult =
  | { ok: true; downloadUrl: string }
  | { ok: false; errorMessage: string };

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
    if (!compressed.base64) {
      return { ok: false, errorMessage: 'Kunde inte förbereda logotypen för uppladdning.' };
    }

    const path = `organizations/${trimmedOrgId}/logo.jpg`;
    const storageRef = ref(storage, path);
    await uploadString(storageRef, compressed.base64, 'base64', {
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
