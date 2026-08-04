import type { Organization } from '@/constants/organizations';
import { createOrganizerSlug } from '@/utils/organizer-slug';

type FirestoreOrganizationData = Record<string, unknown>;

function readString(data: FirestoreOrganizationData, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/** Maps a Firestore organization document, or null if required fields are missing. */
export function mapOrganizationDocument(
  id: string,
  data: FirestoreOrganizationData,
): Organization | null {
  const name = readString(data, 'name');
  if (!name) {
    return null;
  }

  const slug = readString(data, 'slug') || createOrganizerSlug(name);

  return {
    id,
    name,
    slug,
    description: readString(data, 'description'),
    logoUrl: readString(data, 'logoUrl'),
    website: readString(data, 'website'),
    membershipUrl: readString(data, 'membershipUrl'),
    email: readString(data, 'email'),
    phone: readString(data, 'phone'),
    city: readString(data, 'city'),
  };
}
