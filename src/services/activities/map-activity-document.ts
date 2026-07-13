import { normalizeCategory, type Activity } from '@/constants/activities';
import { normalizeRegistrationMethod } from '@/constants/membership';

type FirestoreActivityData = Record<string, unknown>;

function readString(data: FirestoreActivityData, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readImageUrl(data: FirestoreActivityData): string | null {
  const value = data.imageUrl;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return typeof value === 'string' ? value.trim() : null;
}

function readCoordinate(data: FirestoreActivityData, key: 'latitude' | 'longitude'): number | null {
  const value = data[key];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function readBoolean(data: FirestoreActivityData, key: string): boolean | null {
  const value = data[key];
  return typeof value === 'boolean' ? value : null;
}

function readNonNegativeInteger(data: FirestoreActivityData, key: string): number | null {
  const value = data[key];

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.floor(value);
}

function readPositiveInteger(data: FirestoreActivityData, key: string): number | null {
  const value = data[key];

  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.floor(value);
}

/** Maps a Firestore document to an Activity, or null if required fields are missing. */
export function mapActivityDocument(id: string, data: FirestoreActivityData): Activity | null {
  const title = readString(data, 'title');
  const description = readString(data, 'description');
  const date = readString(data, 'date');
  const time = readString(data, 'time');
  const location = readString(data, 'location');
  const organizer = readString(data, 'organizer');

  if (!title || !description || !date || !time || !location || !organizer) {
    return null;
  }

  return {
    id,
    title,
    description,
    date,
    time,
    location,
    organizer,
    category: normalizeCategory(data.category),
    imageUrl: readImageUrl(data),
    latitude: readCoordinate(data, 'latitude'),
    longitude: readCoordinate(data, 'longitude'),
    address: readString(data, 'address'),
    registrationRequired: readBoolean(data, 'registrationRequired'),
    hasParticipantLimit: readBoolean(data, 'hasParticipantLimit'),
    maxParticipants: readPositiveInteger(data, 'maxParticipants'),
    participants: readNonNegativeInteger(data, 'participants'),
    membershipRequired: readBoolean(data, 'membershipRequired'),
    membershipOrganization: readString(data, 'membershipOrganization'),
    membershipUrl: readString(data, 'membershipUrl'),
    registrationMethod: normalizeRegistrationMethod(data.registrationMethod),
    registrationUrl: readString(data, 'registrationUrl'),
    registrationPhone: readString(data, 'registrationPhone'),
    registrationEmail: readString(data, 'registrationEmail'),
  };
}
