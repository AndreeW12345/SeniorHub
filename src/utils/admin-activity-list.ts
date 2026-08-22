import type { Activity } from '@/constants/activities';
import type { RecurrenceRule } from '@/constants/recurrence';
import { parseDateValue } from '@/utils/date-time-format';
import { isSeriesActivity } from '@/utils/recurrence';

export type AdminActivitySeriesGroup = {
  kind: 'series';
  seriesId: string;
  title: string;
  category: Activity['category'];
  recurrence: RecurrenceRule;
  occurrences: Activity[];
  nextOccurrence: Activity;
  firstDate: string;
  lastDate: string;
};

export type AdminActivityListEntry =
  | { kind: 'single'; activity: Activity }
  | AdminActivitySeriesGroup;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

function sortOccurrences(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const indexA = a.occurrenceIndex ?? Number.MAX_SAFE_INTEGER;
    const indexB = b.occurrenceIndex ?? Number.MAX_SAFE_INTEGER;
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.date.localeCompare(b.date);
  });
}

/** Picks the nearest upcoming non-cancelled occurrence, or the last in the series. */
export function pickNextSeriesOccurrence(
  occurrences: Activity[],
  referenceDate: Date = new Date(),
): Activity {
  const sorted = sortOccurrences(occurrences);
  const today = startOfLocalDay(referenceDate).getTime();

  const upcoming = sorted.filter((activity) => {
    if (activity.isCancelled === true) {
      return false;
    }

    const activityDate = parseDateValue(activity.date);
    return activityDate !== null && activityDate.getTime() >= today;
  });

  if (upcoming.length > 0) {
    return upcoming[0];
  }

  return sorted[sorted.length - 1];
}

/** Short Swedish date label for admin series summaries (e.g. "15 sep. 2026"). */
export function formatAdminShortDate(value: string): string {
  const date = parseDateValue(value);
  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function entrySortDate(entry: AdminActivityListEntry): number {
  const dateValue =
    entry.kind === 'single' ? entry.activity.date : entry.nextOccurrence.date;
  return parseDateValue(dateValue)?.getTime() ?? 0;
}

/**
 * Groups materialized series occurrences into one admin row per `seriesId`.
 * One-off activities remain individual entries.
 */
export function groupActivitiesForAdminList(activities: Activity[]): AdminActivityListEntry[] {
  const singles: Activity[] = [];
  const seriesMap = new Map<string, Activity[]>();

  for (const activity of activities) {
    const seriesId = activity.seriesId?.trim();
    if (isSeriesActivity(activity) && seriesId) {
      const current = seriesMap.get(seriesId) ?? [];
      current.push(activity);
      seriesMap.set(seriesId, current);
      continue;
    }

    singles.push(activity);
  }

  const entries: AdminActivityListEntry[] = singles.map((activity) => ({
    kind: 'single',
    activity,
  }));

  for (const [seriesId, occurrences] of seriesMap) {
    const sorted = sortOccurrences(occurrences);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const recurrence = first.recurrence;

    if (!recurrence) {
      for (const activity of sorted) {
        entries.push({ kind: 'single', activity });
      }
      continue;
    }

    entries.push({
      kind: 'series',
      seriesId,
      title: first.title,
      category: first.category,
      recurrence,
      occurrences: sorted,
      nextOccurrence: pickNextSeriesOccurrence(sorted),
      firstDate: first.date,
      lastDate: last.date,
    });
  }

  return entries.sort((a, b) => entrySortDate(b) - entrySortDate(a));
}
