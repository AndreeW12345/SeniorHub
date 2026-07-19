import type { Activity, Category } from '@/constants/activities';
import type { ActivityQuickFilter } from '@/constants/activity-filters';
import { parseDateValue } from '@/utils/date-time-format';

function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/** Case-insensitive match on title, description and place (location/address). */
export function activityMatchesSearchQuery(activity: Activity, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  return (
    normalizeSearchText(activity.title).includes(normalizedQuery) ||
    normalizeSearchText(activity.description).includes(normalizedQuery) ||
    normalizeSearchText(activity.location).includes(normalizedQuery) ||
    normalizeSearchText(activity.address).includes(normalizedQuery)
  );
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Swedish week range Monday–Sunday for the given reference day. */
export function getLocalWeekRange(reference: Date = new Date()): { start: Date; end: Date } {
  const today = startOfLocalDay(reference);
  const day = today.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const start = new Date(today);
  start.setDate(today.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function activityMatchesQuickFilter(
  activity: Activity,
  quickFilter: ActivityQuickFilter,
  referenceDate: Date = new Date(),
): boolean {
  if (quickFilter === 'registration_required') {
    return activity.registrationRequired === true;
  }

  const activityDate = parseDateValue(activity.date);
  if (!activityDate) {
    return false;
  }

  if (quickFilter === 'today') {
    return isSameLocalDay(activityDate, referenceDate);
  }

  if (quickFilter === 'this_week') {
    const { start, end } = getLocalWeekRange(referenceDate);
    const time = activityDate.getTime();
    return time >= start.getTime() && time <= end.getTime();
  }

  return true;
}

/** All selected quick filters must match (AND). Empty selection = no quick filter. */
export function activityMatchesQuickFilters(
  activity: Activity,
  quickFilters: readonly ActivityQuickFilter[],
  referenceDate: Date = new Date(),
): boolean {
  if (quickFilters.length === 0) {
    return true;
  }

  return quickFilters.every((filter) =>
    activityMatchesQuickFilter(activity, filter, referenceDate),
  );
}

export type BrowseActivitiesOptions = {
  query?: string;
  category?: Category;
  /** Multi-select quick filters. Empty array means "Alla". */
  quickFilters?: readonly ActivityQuickFilter[];
  referenceDate?: Date;
};

/** Combines text search, category and quick filters for the activities browse screen. */
export function browseActivities(
  activities: Activity[],
  options: BrowseActivitiesOptions = {},
): Activity[] {
  const query = options.query ?? '';
  const category = options.category ?? 'Alla';
  const quickFilters = options.quickFilters ?? [];
  const referenceDate = options.referenceDate ?? new Date();

  return activities.filter((activity) => {
    const matchesCategory = category === 'Alla' || activity.category === category;
    return (
      matchesCategory &&
      activityMatchesSearchQuery(activity, query) &&
      activityMatchesQuickFilters(activity, quickFilters, referenceDate)
    );
  });
}

/** Toggles a quick filter in a multi-select list (immutable). */
export function toggleActivityQuickFilter(
  current: readonly ActivityQuickFilter[],
  filter: ActivityQuickFilter,
): ActivityQuickFilter[] {
  if (current.includes(filter)) {
    return current.filter((item) => item !== filter);
  }

  return [...current, filter];
}
