import type { AdminAccount, AdminActivityScope } from '@/constants/admin-account';
import type { Activity } from '@/constants/activities';

/** True when the admin may manage this activity (own org or superadmin). */
export function canAdminAccessActivity(
  account: AdminAccount | null | undefined,
  activity: Pick<Activity, 'organizationId'> | null | undefined,
): boolean {
  if (!account || !activity) {
    return false;
  }

  if (account.role === 'superadmin') {
    return true;
  }

  const activityOrgId = activity.organizationId?.trim();
  return Boolean(activityOrgId && activityOrgId === account.organizationId);
}

/** Filters activities for the admin panel scope toggle. */
export function filterActivitiesForAdminScope(
  activities: Activity[],
  account: AdminAccount | null | undefined,
  scope: AdminActivityScope,
): Activity[] {
  if (!account) {
    return [];
  }

  if (scope === 'all' && account.role === 'superadmin') {
    return activities;
  }

  const organizationId = account.organizationId.trim();
  if (!organizationId) {
    return [];
  }

  return activities.filter(
    (activity) => activity.organizationId?.trim() === organizationId,
  );
}
