import { formatDateValue, parseDateValue } from '@/utils/date-time-format';

export function isDateInLocalMonth(date: Date, reference: Date = new Date()): boolean {
  return (
    date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
  );
}

/** True when the activity date is today or in the future. */
export function isActivityActive(activityDate: string, reference: Date = new Date()): boolean {
  const parsed = parseDateValue(activityDate);
  if (!parsed) {
    return false;
  }

  return formatDateValue(parsed) >= formatDateValue(reference);
}

/** True when the activity date is before today (completed / past). */
export function isActivityCompleted(activityDate: string, reference: Date = new Date()): boolean {
  const parsed = parseDateValue(activityDate);
  if (!parsed) {
    return false;
  }

  return formatDateValue(parsed) < formatDateValue(reference);
}

export function isActivityDateInLocalMonth(
  activityDate: string,
  reference: Date = new Date(),
): boolean {
  const parsed = parseDateValue(activityDate);
  if (!parsed) {
    return false;
  }

  return isDateInLocalMonth(parsed, reference);
}

export function parseFirestoreDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}
