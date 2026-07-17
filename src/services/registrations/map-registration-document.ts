import {
  DEFAULT_REGISTRATION_STATUS,
  normalizeRegistrationStatus,
  type ActivityRegistration,
} from '@/constants/registrations';

type FirestoreRegistrationData = Record<string, unknown>;

function readString(data: FirestoreRegistrationData, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readRegisteredAt(data: FirestoreRegistrationData): Date | null {
  const value = data.registeredAt;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/** Maps a Firestore registration document to ActivityRegistration, or null if invalid. */
export function mapRegistrationDocument(
  id: string,
  activityId: string,
  data: FirestoreRegistrationData,
): ActivityRegistration | null {
  const name = readString(data, 'name');
  const phone = readString(data, 'phone');
  const registeredAt = readRegisteredAt(data);

  if (!name || !phone || !registeredAt) {
    return null;
  }

  return {
    id,
    activityId,
    name,
    phone,
    registeredAt,
    status: normalizeRegistrationStatus(data.status ?? DEFAULT_REGISTRATION_STATUS),
  };
}
