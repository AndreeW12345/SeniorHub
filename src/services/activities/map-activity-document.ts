import { normalizeCategory, type Activity } from '@/constants/activities';

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
  };
}
