import { createOrganizerSlug } from '@/utils/organizer-slug';
import type { Activity } from '@/constants/activities';

/**
 * Tenant organization (municipality, association, club).
 * Public-facing host profile for activities owned by the organization.
 */
export type Organization = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  /** External membership signup URL used by “Bli medlem”-actions. */
  membershipUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
};

export type OrganizationFormInput = {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  membershipUrl?: string;
  email?: string;
  phone?: string;
  city?: string;
};

export function getOrganizationPath(organization: Pick<Organization, 'slug' | 'name'>): `/organizer/${string}` {
  const slug = organization.slug?.trim() || createOrganizerSlug(organization.name);
  return `/organizer/${slug}`;
}

export function findOrganizationById(
  organizations: Organization[],
  organizationId: string | null | undefined,
): Organization | undefined {
  const trimmed = organizationId?.trim();
  if (!trimmed) {
    return undefined;
  }

  return organizations.find((organization) => organization.id === trimmed);
}

export function findOrganizationBySlug(
  organizations: Organization[],
  slug: string | null | undefined,
): Organization | undefined {
  const trimmed = slug?.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }

  return organizations.find((organization) => organization.slug === trimmed);
}

/** Activities owned by the organization, with legacy organizer-slug fallback. */
export function getActivitiesForOrganization(
  activities: Activity[],
  organization: Organization,
): Activity[] {
  const byOrganizationId = activities.filter(
    (activity) => activity.organizationId?.trim() === organization.id,
  );

  if (byOrganizationId.length > 0) {
    return byOrganizationId;
  }

  const slug = organization.slug;
  return activities.filter(
    (activity) => createOrganizerSlug(activity.organizer) === slug,
  );
}
