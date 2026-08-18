import { formatAddressDisplay } from '@/utils/address-format';
import type { RegistrationMethod } from '@/constants/membership';
import type { RecurrenceRule } from '@/constants/recurrence';

export const CATEGORIES = [
  'Alla',
  'Promenad',
  'Fika',
  'Spel',
  'Musik',
  'Träning',
  'Kultur',
  'Frivilligt',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type ActivityCategory = Exclude<Category, 'Alla'>;

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  'Promenad',
  'Fika',
  'Spel',
  'Musik',
  'Träning',
  'Kultur',
  'Frivilligt',
];

/** Fallback category used when a stored value is missing or unrecognized. */
export const DEFAULT_CATEGORY: ActivityCategory = 'Frivilligt';

/** Maps legacy category names to the current set so older data keeps working. */
const LEGACY_CATEGORY_MAP: Record<string, ActivityCategory> = {
  Motion: 'Träning',
  Promenader: 'Promenad',
  Kurser: 'Frivilligt',
};

/** Normalizes any stored category value to a valid current category. */
export function normalizeCategory(value: unknown): ActivityCategory {
  if (typeof value !== 'string') {
    return DEFAULT_CATEGORY;
  }

  if (ACTIVITY_CATEGORIES.includes(value as ActivityCategory)) {
    return value as ActivityCategory;
  }

  return LEGACY_CATEGORY_MAP[value] ?? DEFAULT_CATEGORY;
}

export type Activity = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: ActivityCategory;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** @deprecated Prefer fullAddress for display; kept for legacy documents. */
  address?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  /** Canonical address for display and maps, e.g. "Tyresö centrum 1, 135 40 Tyresö". */
  fullAddress?: string | null;
  /** Admin tenancy – which organization owns this activity. */
  organizationId?: string | null;
  registrationRequired?: boolean | null;
  hasParticipantLimit?: boolean | null;
  maxParticipants?: number | null;
  participants?: number | null;
  membershipRequired?: boolean | null;
  membershipOrganization?: string | null;
  membershipUrl?: string | null;
  registrationMethod?: RegistrationMethod | null;
  registrationUrl?: string | null;
  registrationPhone?: string | null;
  registrationEmail?: string | null;
  /**
   * Shared id for all materialized occurrences in a recurring series.
   * Absent/null for one-off (legacy) activities.
   */
  seriesId?: string | null;
  /** Zero-based index within the series. */
  occurrenceIndex?: number | null;
  /** Recurrence rule copied onto each occurrence for display and future expansion. */
  recurrence?: RecurrenceRule | null;
  /** True when this occurrence was edited independently of the rest of the series. */
  isRecurrenceException?: boolean | null;
  /** True when the activity has been cancelled / ställts in. */
  isCancelled?: boolean | null;
};

export function getActivityDisplayLocation(activity: Activity): string {
  const fullAddress = activity.fullAddress?.trim();
  if (fullAddress) {
    return fullAddress;
  }

  const address = activity.address?.trim();
  if (address) {
    return formatAddressDisplay(address);
  }

  return formatAddressDisplay(activity.location);
}

/** Short place name for activity cards (not the full street address). */
export function getActivityPlaceName(activity: Activity): string {
  const placeName = activity.location?.trim();
  if (placeName) {
    return placeName;
  }

  const displayLocation = getActivityDisplayLocation(activity);
  const firstSegment = displayLocation.split(',')[0]?.trim();
  return firstSegment || displayLocation;
}

/** Full stored location string for map links and other non-display uses. */
export function getActivityMapsLocation(activity: Activity): string {
  const fullAddress = activity.fullAddress?.trim();
  if (fullAddress) {
    return fullAddress;
  }

  const address = activity.address?.trim();
  if (address) {
    return address;
  }

  return activity.location;
}

export function hasActivityCoordinates(activity: Activity): boolean {
  return (
    typeof activity.latitude === 'number' &&
    typeof activity.longitude === 'number' &&
    Number.isFinite(activity.latitude) &&
    Number.isFinite(activity.longitude)
  );
}

export function getActivitiesWithCoordinates(activities: Activity[]): Activity[] {
  return activities.filter(hasActivityCoordinates);
}

export function hasActivityImage(activity: Activity): boolean {
  return typeof activity.imageUrl === 'string' && activity.imageUrl.trim().length > 0;
}

export function getActivityById(activities: Activity[], id: string): Activity | undefined {
  return activities.find((activity) => activity.id === id);
}

export function getActivitiesByIds(activities: Activity[], ids: string[]): Activity[] {
  const activityMap = new Map(activities.map((activity) => [activity.id, activity]));

  return ids
    .map((id) => activityMap.get(id))
    .filter((activity): activity is Activity => activity !== undefined);
}

export function getGoogleMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
