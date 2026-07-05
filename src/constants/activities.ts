export const CATEGORIES = ['Alla', 'Fika', 'Motion', 'Kultur', 'Kurser', 'Promenader'] as const;

export type Category = (typeof CATEGORIES)[number];

export type ActivityCategory = Exclude<Category, 'Alla'>;

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  'Fika',
  'Motion',
  'Kultur',
  'Kurser',
  'Promenader',
];

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
};

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
      activity.organizer.toLowerCase().includes(normalizedQuery) ||
      activity.category.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
