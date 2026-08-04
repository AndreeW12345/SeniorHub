import type { Activity } from '@/constants/activities';
import {
  getOrganizationPath,
  type Organization,
} from '@/constants/organizations';
import { getOrganizerPath } from '@/constants/organizers';

/** Prefer the tenant organization profile; fall back to free-text organizer. */
export function getActivityOrganizerDisplayName(
  activity: Activity,
  organization?: Organization | null,
): string {
  const orgName = organization?.name?.trim();
  if (orgName) {
    return orgName;
  }

  return activity.organizer;
}

export function getActivityOrganizerHref(
  activity: Activity,
  organization?: Organization | null,
): `/organizer/${string}` {
  if (organization) {
    return getOrganizationPath(organization);
  }

  return getOrganizerPath(activity.organizer);
}

/**
 * Membership club name for UI copy.
 * Prefers organization profile, then legacy activity.membershipOrganization.
 */
export function resolveActivityMembershipOrganizationName(
  activity: Activity,
  organization?: Organization | null,
): string | null {
  if (activity.membershipRequired !== true) {
    return null;
  }

  const fromOrganization = organization?.name?.trim();
  if (fromOrganization) {
    return fromOrganization;
  }

  const legacy = activity.membershipOrganization?.trim();
  return legacy && legacy.length > 0 ? legacy : null;
}

/**
 * Membership join URL for “Bli medlem”.
 * Prefers organization profile, then legacy activity.membershipUrl.
 */
export function resolveActivityMembershipUrl(
  activity: Activity,
  organization?: Organization | null,
): string | null {
  if (activity.membershipRequired !== true) {
    return null;
  }

  const fromOrganization = organization?.membershipUrl?.trim();
  if (fromOrganization) {
    return fromOrganization;
  }

  const legacy = activity.membershipUrl?.trim();
  return legacy && legacy.length > 0 ? legacy : null;
}
