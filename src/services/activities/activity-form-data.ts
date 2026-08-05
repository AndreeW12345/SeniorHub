import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/activities';
import {
  DEFAULT_REGISTRATION_METHOD,
  type RegistrationMethod,
} from '@/constants/membership';
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
  street?: string;
  postalCode?: string;
  city?: string;
  fullAddress?: string;
  registrationRequired?: boolean;
  hasParticipantLimit?: boolean;
  maxParticipants?: string;
  participants?: number;
  membershipRequired?: boolean;
  membershipOrganization?: string;
  membershipUrl?: string;
  registrationMethod?: RegistrationMethod;
  registrationUrl?: string;
  registrationPhone?: string;
  registrationEmail?: string;
  /** When true, the activity is cancelled / ställts in. */
  isCancelled?: boolean;
};

export type ActivityMutationResult =
  | { ok: true; id: string }
  | { ok: false; errorMessage: string };

function readRequired(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePositiveIntegerInput(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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

  if (latitude === null || longitude === null) {
    return {
      ok: false as const,
      errorMessage: 'Aktiviteten måste ha giltiga koordinater innan den kan sparas.',
    };
  }

  const street = readRequired(input.street ?? '');
  const postalCode = readRequired(input.postalCode ?? '');
  const city = readRequired(input.city ?? '');
  const fullAddress = readRequired(input.fullAddress ?? '');

  if (!street || !postalCode || !city || !fullAddress) {
    return {
      ok: false as const,
      errorMessage: 'Ange gatuadress, postnummer och ort.',
    };
  }

  const registrationRequired = input.registrationRequired === true;
  const hasParticipantLimit = input.hasParticipantLimit === true;
  const membershipRequired = input.membershipRequired === true;
  const maxParticipants = hasParticipantLimit
    ? parsePositiveIntegerInput(input.maxParticipants)
    : null;

  if (hasParticipantLimit && maxParticipants === null) {
    return {
      ok: false as const,
      errorMessage: 'Ange ett giltigt max antal deltagare.',
    };
  }

  // Membership club name/URL live on the organization profile.
  // Legacy per-activity values are kept only when explicitly provided.
  const membershipOrganization = membershipRequired
    ? readRequired(input.membershipOrganization ?? '')
    : null;
  const membershipUrlRaw = membershipRequired ? readRequired(input.membershipUrl ?? '') : null;

  if (membershipRequired && membershipUrlRaw && !isValidHttpUrl(membershipUrlRaw)) {
    return {
      ok: false as const,
      errorMessage: 'Medlemskapets länk måste börja med http:// eller https://.',
    };
  }

  const membershipUrl = membershipUrlRaw;

  const registrationMethod = registrationRequired
    ? (input.registrationMethod ?? DEFAULT_REGISTRATION_METHOD)
    : null;

  let registrationUrl: string | null = null;
  let registrationPhone: string | null = null;
  let registrationEmail: string | null = null;

  if (registrationRequired && registrationMethod === 'external') {
    registrationUrl = readRequired(input.registrationUrl ?? '');

    if (!registrationUrl) {
      return {
        ok: false as const,
        errorMessage: 'Ange webbadress för extern anmälan.',
      };
    }

    if (!isValidHttpUrl(registrationUrl)) {
      return {
        ok: false as const,
        errorMessage: 'Anmälningslänken måste börja med http:// eller https://.',
      };
    }
  }

  if (registrationRequired && registrationMethod === 'phone') {
    registrationPhone = readRequired(input.registrationPhone ?? '');

    if (!registrationPhone) {
      return {
        ok: false as const,
        errorMessage: 'Ange telefonnummer för anmälan.',
      };
    }
  }

  if (registrationRequired && registrationMethod === 'email') {
    registrationEmail = readRequired(input.registrationEmail ?? '');

    if (!registrationEmail) {
      return {
        ok: false as const,
        errorMessage: 'Ange e-postadress för anmälan.',
      };
    }
  }

  const participants =
    registrationRequired && typeof input.participants === 'number' && input.participants >= 0
      ? Math.floor(input.participants)
      : registrationRequired
        ? 0
        : null;

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
      street,
      postalCode,
      city,
      fullAddress,
      /** Keep legacy `address` in sync for older readers. */
      address: fullAddress,
      registrationRequired,
      hasParticipantLimit,
      maxParticipants: hasParticipantLimit ? maxParticipants : null,
      participants,
      membershipRequired,
      membershipOrganization: membershipRequired ? membershipOrganization : null,
      membershipUrl: membershipRequired ? membershipUrl : null,
      registrationMethod,
      registrationUrl,
      registrationPhone,
      registrationEmail,
      isCancelled: input.isCancelled === true,
    },
  };
}

export function getFirestoreUnavailableResult(): ActivityMutationResult {
  return { ok: false, errorMessage: 'Firestore kunde inte initieras.' };
}
