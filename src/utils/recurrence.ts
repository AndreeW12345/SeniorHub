import {
  isActiveRecurrenceFrequency,
  MAX_RECURRENCE_OCCURRENCES,
  type ActiveRecurrenceFrequency,
  type RecurrenceRule,
} from '@/constants/recurrence';
import { formatDateValue, parseDateValue } from '@/utils/date-time-format';

function resolveInterval(rule: RecurrenceRule): number {
  if (typeof rule.interval === 'number' && Number.isFinite(rule.interval) && rule.interval >= 1) {
    return Math.floor(rule.interval);
  }

  return rule.frequency === 'biweekly' ? 2 : 1;
}

function resolveFrequencyUnit(frequency: ActiveRecurrenceFrequency): 'weekly' | 'monthly' {
  return frequency === 'monthly' ? 'monthly' : 'weekly';
}

/** Advances a local calendar date by the recurrence step. */
export function addRecurrenceStep(
  date: Date,
  frequency: ActiveRecurrenceFrequency,
  interval = 1,
  /** For monthly rules: preferred day-of-month from the series start (e.g. 31). */
  anchorDayOfMonth?: number,
): Date {
  const safeInterval = Math.max(1, Math.floor(interval));
  const year = date.getFullYear();
  const month = date.getMonth();
  const dayOfMonth =
    typeof anchorDayOfMonth === 'number' && Number.isFinite(anchorDayOfMonth)
      ? Math.floor(anchorDayOfMonth)
      : date.getDate();

  if (resolveFrequencyUnit(frequency) === 'monthly') {
    // Set day to 1 first so JS does not overflow Jan 31 → March when entering February.
    const cursor = new Date(year, month, 1, 12, 0, 0, 0);
    cursor.setMonth(cursor.getMonth() + safeInterval);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    cursor.setDate(Math.min(dayOfMonth, monthEnd));
    return cursor;
  }

  const next = new Date(year, month, date.getDate(), 12, 0, 0, 0);
  next.setDate(next.getDate() + 7 * safeInterval);
  return next;
}

/**
 * Generates occurrence dates (`YYYY-MM-DD`) from a recurrence rule.
 * The first date is always `rule.startDate`. Weekday follows that start date.
 */
export function generateOccurrenceDates(rule: RecurrenceRule): string[] {
  const start = parseDateValue(rule.startDate);
  if (!start) {
    return [];
  }

  const end = rule.endDate ? parseDateValue(rule.endDate) : null;
  if (rule.endDate && !end) {
    return [];
  }

  const interval = resolveInterval(rule);
  const maxFromRule =
    typeof rule.maxOccurrences === 'number' && Number.isFinite(rule.maxOccurrences)
      ? Math.max(1, Math.floor(rule.maxOccurrences))
      : MAX_RECURRENCE_OCCURRENCES;
  const maxCount = Math.min(maxFromRule, MAX_RECURRENCE_OCCURRENCES);
  const anchorDayOfMonth = start.getDate();

  const dates: string[] = [];
  let cursor = start;

  for (let index = 0; index < maxCount; index += 1) {
    if (end && cursor.getTime() > end.getTime()) {
      break;
    }

    dates.push(formatDateValue(cursor));
    cursor = addRecurrenceStep(cursor, rule.frequency, interval, anchorDayOfMonth);
  }

  return dates;
}

export function buildRecurrenceRule(input: {
  frequency: ActiveRecurrenceFrequency;
  startDate: string;
  endDate?: string | null;
  maxOccurrences?: number | null;
}): RecurrenceRule {
  const endDate = input.endDate?.trim() || null;
  const maxOccurrences =
    typeof input.maxOccurrences === 'number' && Number.isFinite(input.maxOccurrences)
      ? Math.max(1, Math.floor(input.maxOccurrences))
      : null;

  return {
    frequency: input.frequency,
    startDate: input.startDate.trim(),
    endDate,
    maxOccurrences,
    interval: input.frequency === 'biweekly' ? 2 : 1,
  };
}

/** Parses a Firestore recurrence object into a typed rule, or null if invalid. */
export function parseRecurrenceRule(value: unknown): RecurrenceRule | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const data = value as Record<string, unknown>;
  const frequencyValue = typeof data.frequency === 'string' ? data.frequency : null;
  if (!isActiveRecurrenceFrequency(frequencyValue)) {
    return null;
  }

  const startDate = typeof data.startDate === 'string' ? data.startDate.trim() : '';
  if (!startDate || !parseDateValue(startDate)) {
    return null;
  }

  const endDateRaw = typeof data.endDate === 'string' ? data.endDate.trim() : null;
  const endDate = endDateRaw && parseDateValue(endDateRaw) ? endDateRaw : null;

  let maxOccurrences: number | null = null;
  if (typeof data.maxOccurrences === 'number' && Number.isFinite(data.maxOccurrences)) {
    maxOccurrences = Math.max(1, Math.floor(data.maxOccurrences));
  }

  let interval: number | undefined;
  if (typeof data.interval === 'number' && Number.isFinite(data.interval) && data.interval >= 1) {
    interval = Math.floor(data.interval);
  }

  const bySetPos =
    typeof data.bySetPos === 'number' && Number.isFinite(data.bySetPos)
      ? Math.floor(data.bySetPos)
      : null;
  const byWeekday = typeof data.byWeekday === 'string' ? data.byWeekday.trim() : null;

  return {
    frequency: frequencyValue,
    startDate,
    endDate,
    maxOccurrences,
    interval,
    bySetPos,
    byWeekday,
  };
}

export function createSeriesId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `series_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isSeriesActivity(activity: {
  seriesId?: string | null;
}): boolean {
  return typeof activity.seriesId === 'string' && activity.seriesId.trim().length > 0;
}

/** Swedish weekday label for a stored `YYYY-MM-DD` date. */
export function getWeekdayLabel(dateValue: string): string {
  const date = parseDateValue(dateValue);
  if (!date) {
    return '';
  }

  const label = new Intl.DateTimeFormat('sv-SE', { weekday: 'long' }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
