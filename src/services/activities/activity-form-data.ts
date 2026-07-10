import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/activities';
import {
  parseCoordinateInput,
  validateActivityCoordinates,
} from '@/utils/activity-coordinates';

export type ActivityFormInput = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: ActivityCategory;
  imageUrl?: string;
  latitude?: string;
  longitude?: string;
  address?: string;
};

export type ActivityMutationResult =
  | { ok: true; id: string }
  | { ok: false; errorMessage: string };

function readRequired(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildActivityDocumentData(input: ActivityFormInput) {
  const title = readRequired(input.title);
  const description = readRequired(input.description);
  const date = readRequired(input.date);
  const time = readRequired(input.time);
  const location = readRequired(input.location);
  const organizer = readRequired(input.organizer);

  if (!title || !description || !date || !time || !location || !organizer) {
    return { ok: false as const, errorMessage: 'Alla obligatoriska fält måste fyllas i.' };
  }

  if (!ACTIVITY_CATEGORIES.includes(input.category)) {
    return { ok: false as const, errorMessage: 'Ogiltig kategori.' };
  }

  const latitude = parseCoordinateInput(input.latitude);
  const longitude = parseCoordinateInput(input.longitude);
  const coordinateError = validateActivityCoordinates(latitude, longitude);

  if (coordinateError) {
    return { ok: false as const, errorMessage: coordinateError };
  }

  if (input.latitude?.trim() && latitude === null) {
    return { ok: false as const, errorMessage: 'Latituden har fel format.' };
  }

  if (input.longitude?.trim() && longitude === null) {
    return { ok: false as const, errorMessage: 'Longituden har fel format.' };
  }

  return {
    ok: true as const,
    data: {
      title,
      description,
      date,
      time,
      location,
      organizer,
      category: input.category,
      imageUrl: input.imageUrl?.trim() || null,
      latitude,
      longitude,
      address: input.address?.trim() || null,
    },
  };
}

export function getFirestoreUnavailableResult(): ActivityMutationResult {
  return { ok: false, errorMessage: 'Firestore kunde inte initieras.' };
}
