import type { Organizer } from '@/constants/organizers';
import { createOrganizerSlug } from '@/utils/organizer-slug';

type FirestoreOrganizerData = Record<string, unknown>;

function readString(data: FirestoreOrganizerData, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readOptionalString(data: FirestoreOrganizerData, key: string): string | null {
  const value = data[key];

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return typeof value === 'string' ? value.trim() : null;
}

/** Maps a Firestore document to an Organizer, or null if required fields are missing. */
export function mapOrganizerDocument(id: string, data: FirestoreOrganizerData): Organizer | null {
  const name = readString(data, 'name');
  const description = readString(data, 'description');

  if (!name || !description) {
    return null;
  }

  const slug = readString(data, 'slug') ?? createOrganizerSlug(name);

  return {
    id,
    name,
    slug,
    description,
    phone: readOptionalString(data, 'phone'),
    email: readOptionalString(data, 'email'),
    website: readOptionalString(data, 'website'),
  };
}
