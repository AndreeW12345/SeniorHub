/**
 * Helpers for converting between Date objects and the string formats stored in
 * Firestore. The stored formats are kept identical to what the manual text
 * inputs produced before (date: `YYYY-MM-DD`, time: `HH:mm`) so existing
 * activities keep working.
 */

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Formats a Date as `YYYY-MM-DD`. */
export function formatDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Formats a Date as 24-hour `HH:mm`. */
export function formatTimeValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parses a `YYYY-MM-DD` string, or null if it does not match. */
export function parseDateValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Anchor at midday to avoid timezone rollover to the previous/next day.
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

/** Parses an `HH:mm` string, or null if it does not match. */
export function parseTimeValue(value: string): Date | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/** Returns a friendly Swedish date label (e.g. "15 juli 2026") for a stored value. */
export function formatDateDisplay(value: string): string {
  const date = parseDateValue(value);
  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
