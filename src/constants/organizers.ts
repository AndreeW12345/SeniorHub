import type { Activity } from '@/constants/activities';
import { createOrganizerSlug } from '@/utils/organizer-slug';

export type Organizer = {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
};

export function getOrganizerPath(name: string): `/organizer/${string}` {
  return `/organizer/${createOrganizerSlug(name)}`;
}

export function getActivitiesByOrganizerSlug(activities: Activity[], slug: string): Activity[] {
  return activities.filter((activity) => createOrganizerSlug(activity.organizer) === slug);
}

export function findOrganizerBySlug(organizers: Organizer[], slug: string): Organizer | undefined {
  return organizers.find((organizer) => organizer.slug === slug);
}

export function resolveOrganizerName(
  organizers: Organizer[],
  activities: Activity[],
  slug: string,
): string | null {
  const profile = findOrganizerBySlug(organizers, slug);
  if (profile) {
    return profile.name;
  }

  const matchingActivities = getActivitiesByOrganizerSlug(activities, slug);
  return matchingActivities[0]?.organizer ?? null;
}
