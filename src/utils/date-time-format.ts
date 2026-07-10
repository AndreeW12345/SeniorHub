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

function capitalizeFirst(text: string): string {
  if (text.length === 0) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Returns a friendly Swedish date label (e.g. "Onsdag 8 juli 2026") for a stored value. */
export function formatDateDisplay(value: string): string {
  const date = parseDateValue(value);
  if (!date) {
    return value;
  }

  const formatted = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  return capitalizeFirst(formatted);
}

/** Returns a friendly Swedish time label (e.g. "Kl. 11:00") for a stored value. */
export function formatTimeDisplay(value: string): string {
  const trimmed = value.trim();
  const parsed = parseTimeValue(trimmed);

  if (parsed) {
    return `Kl. ${formatTimeValue(parsed)}`;
  }

  const rangeMatch = /^(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})$/.exec(trimmed);
  if (rangeMatch) {
    return `Kl. ${rangeMatch[1]} – ${rangeMatch[2]}`;
  }

  if (/^\d{2}:\d{2}/.test(trimmed) && !trimmed.toLowerCase().startsWith('kl.')) {
    return `Kl. ${trimmed}`;
  }

  return trimmed;
}
