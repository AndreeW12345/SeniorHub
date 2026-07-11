import { formatAddressDisplay } from '@/utils/address-format';

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
  address?: string | null;
};

export function getActivityDisplayLocation(activity: Activity): string {
  const address = activity.address?.trim();
  if (address) {
    return formatAddressDisplay(address);
  }

  return formatAddressDisplay(activity.location);
}

/** Full stored location string for map links and other non-display uses. */
export function getActivityMapsLocation(activity: Activity): string {
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

export function filterActivities(
  activities: Activity[],
  query: string,
  category: Category,
): Activity[] {
  const normalizedQuery = query.trim().toLowerCase();

  return activities.filter((activity) => {
    const matchesCategory = category === 'Alla' || activity.category === category;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      activity.title.toLowerCase().includes(normalizedQuery) ||
      activity.description.toLowerCase().includes(normalizedQuery) ||
      activity.location.toLowerCase().includes(normalizedQuery) ||
      (activity.address?.toLowerCase().includes(normalizedQuery) ?? false) ||
      activity.organizer.toLowerCase().includes(normalizedQuery) ||
      activity.category.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
