import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import type { Organization, OrganizationFormInput } from '@/constants/organizations';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { mapOrganizationDocument } from '@/services/organizations/map-organization-document';
import { createOrganizerSlug } from '@/utils/organizer-slug';

export type SaveOrganizationResult =
  | { ok: true; organization: Organization }
  | { ok: false; errorMessage: string };

function readOptional(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Creates or updates an organization profile document. */
export async function saveOrganizationToFirestore(
  organizationId: string,
  input: OrganizationFormInput,
): Promise<SaveOrganizationResult> {
  const trimmedId = organizationId.trim();
  if (!trimmedId) {
    return { ok: false, errorMessage: 'Organisationen kunde inte hittas.' };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firestore kunde inte initieras.' };
  }

  const name = input.name.trim();
  if (!name) {
    return { ok: false, errorMessage: 'Ange organisationsnamn.' };
  }

  const website = readOptional(input.website);
  if (website && !isValidHttpUrl(website)) {
    return { ok: false, errorMessage: 'Hemsidan måste börja med http:// eller https://.' };
  }

  const membershipUrl = readOptional(input.membershipUrl);
  if (membershipUrl && !isValidHttpUrl(membershipUrl)) {
    return {
      ok: false,
      errorMessage: 'Medlemslänken måste börja med http:// eller https://.',
    };
  }

  const payload = {
    id: trimmedId,
    name,
    slug: createOrganizerSlug(name),
    description: readOptional(input.description),
    logoUrl: readOptional(input.logoUrl),
    website,
    membershipUrl,
    email: readOptional(input.email),
    phone: readOptional(input.phone),
    city: readOptional(input.city),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, FIRESTORE_COLLECTIONS.organizations, trimmedId), payload, {
      merge: true,
    });

    const organization = mapOrganizationDocument(trimmedId, payload);
    if (!organization) {
      return { ok: false, errorMessage: 'Kunde inte läsa den sparade organisationen.' };
    }

    return { ok: true, organization };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Kunde inte spara organisationen i Firestore.',
    };
  }
}
