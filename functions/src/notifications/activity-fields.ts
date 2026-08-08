import type { ImportantActivityChange, ImportantActivityFields } from './types';

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function resolvePlaceKey(fields: ImportantActivityFields): string {
  const fullAddress = normalizeText(fields.fullAddress);
  if (fullAddress) {
    return fullAddress.toLocaleLowerCase('sv-SE');
  }

  return normalizeText(fields.location).toLocaleLowerCase('sv-SE');
}

export function readImportantActivityFields(
  data: FirebaseFirestore.DocumentData | undefined,
): ImportantActivityFields {
  const record = data ?? {};

  return {
    title: typeof record.title === 'string' ? record.title : '',
    date: typeof record.date === 'string' ? record.date : '',
    time: typeof record.time === 'string' ? record.time : '',
    location: typeof record.location === 'string' ? record.location : '',
    fullAddress:
      typeof record.fullAddress === 'string'
        ? record.fullAddress
        : typeof record.address === 'string'
          ? record.address
          : null,
    isCancelled: record.isCancelled === true,
  };
}

export function detectImportantActivityChanges(
  previous: ImportantActivityFields,
  next: ImportantActivityFields,
): ImportantActivityChange[] {
  const changes: ImportantActivityChange[] = [];

  const wasCancelled = previous.isCancelled === true;
  const isCancelled = next.isCancelled === true;

  if (!wasCancelled && isCancelled) {
    changes.push('cancelled');
  }

  if (normalizeText(previous.date) !== normalizeText(next.date)) {
    changes.push('date');
  }

  if (normalizeText(previous.time) !== normalizeText(next.time)) {
    changes.push('time');
  }

  if (resolvePlaceKey(previous) !== resolvePlaceKey(next)) {
    changes.push('location');
  }

  return changes;
}

function pickPrimaryActivityChange(
  changes: ImportantActivityChange[],
): ImportantActivityChange | null {
  if (changes.includes('cancelled')) {
    return 'cancelled';
  }

  if (changes.includes('date')) {
    return 'date';
  }

  if (changes.includes('time')) {
    return 'time';
  }

  if (changes.includes('location')) {
    return 'location';
  }

  return null;
}

export function pickActivityUpdateChange(
  previous: ImportantActivityFields,
  next: ImportantActivityFields,
): ImportantActivityChange | null {
  return pickPrimaryActivityChange(detectImportantActivityChanges(previous, next));
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function parseDateValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function combineDateAndTime(date: Date, timeValue: string): Date | null {
  const match = /^(\d{2}):(\d{2})$/.exec(timeValue.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

function normalizeStoredTime(value: string): string {
  return value.trim().replace(/^kl\.\s*/i, '');
}

/** Parses activity date/time into a local start Date for reminder scheduling. */
export function parseActivityStartDate(fields: ImportantActivityFields): Date | null {
  const date = parseDateValue(fields.date);
  if (!date) {
    return null;
  }

  const normalizedTime = normalizeStoredTime(fields.time);
  const rangeMatch = /^(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})$/.exec(normalizedTime);
  const startTime = rangeMatch ? rangeMatch[1] : normalizedTime;

  return combineDateAndTime(date, startTime);
}

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
