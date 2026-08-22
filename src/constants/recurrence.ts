/**
 * Recurrence model for SeniorHub activity series.
 *
 * Design:
 * - One-off activities store no recurrence fields (backward compatible).
 * - Recurring activities are materialized as separate Firestore documents that
 *   share a `seriesId` and carry the same `RecurrenceRule`.
 * - Weekday and clock time are always derived from each occurrence's `date`/`time`
 *   — admins never pick a weekday manually.
 * - Future rule types (e.g. first Monday of month) can extend `RecurrenceRule`
 *   without rewriting storage or the occurrence documents.
 */

export const RECURRENCE_FREQUENCIES = ['none', 'weekly', 'biweekly', 'monthly'] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

/** Frequencies that create a multi-occurrence series. */
export type ActiveRecurrenceFrequency = Exclude<RecurrenceFrequency, 'none'>;

export const ACTIVE_RECURRENCE_FREQUENCIES = ['weekly', 'biweekly', 'monthly'] as const;

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  none: 'Engångsaktivitet',
  weekly: 'Varje vecka',
  biweekly: 'Varannan vecka',
  monthly: 'Varje månad',
};

/**
 * Canonical recurrence rule stored on each materialized occurrence.
 * Optional fields are reserved for future RRULE-like extensions.
 */
export type RecurrenceRule = {
  frequency: ActiveRecurrenceFrequency;
  /** First occurrence date (`YYYY-MM-DD`). */
  startDate: string;
  /** Inclusive last date (`YYYY-MM-DD`), optional. */
  endDate?: string | null;
  /** Hard cap on number of occurrences, optional. */
  maxOccurrences?: number | null;
  /**
   * Multiplier for the frequency unit. Defaults to 1.
   * (`weekly` + interval 2 is equivalent to `biweekly`.)
   */
  interval?: number;
  /**
   * Reserved for future positional rules, e.g. first/last weekday in month.
   * Example shape: `{ bySetPos: 1, byWeekday: 'MO' }`.
   */
  bySetPos?: number | null;
  byWeekday?: string | null;
};

export type SeriesEditScope = 'occurrence' | 'series';

export const SERIES_EDIT_SCOPE_LABELS: Record<SeriesEditScope, string> = {
  occurrence: 'Endast detta tillfälle',
  series: 'Hela serien',
};

/** Default number of materialized occurrences when neither end date nor max is set. */
export const DEFAULT_RECURRENCE_OCCURRENCES = 12;

/** Safety cap so a misconfigured rule cannot create unbounded documents. */
export const MAX_RECURRENCE_OCCURRENCES = 52;

export function isActiveRecurrenceFrequency(
  value: string | null | undefined,
): value is ActiveRecurrenceFrequency {
  return (
    value === 'weekly' || value === 'biweekly' || value === 'monthly'
  );
}

export function isRecurrenceFrequency(value: string | null | undefined): value is RecurrenceFrequency {
  return value === 'none' || isActiveRecurrenceFrequency(value);
}
