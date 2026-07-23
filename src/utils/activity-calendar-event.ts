import type { Activity } from '@/constants/activities';
import { getActivityMapsLocation } from '@/constants/activities';
import { parseDateValue } from '@/utils/date-time-format';

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

export type ActivityCalendarEvent = {
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  notes: string;
};

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

/** Parses stored activity date/time into calendar start and end dates. */
export function buildActivityCalendarEvent(activity: Activity): ActivityCalendarEvent | null {
  const date = parseDateValue(activity.date);
  if (!date) {
    return null;
  }

  const normalizedTime = normalizeStoredTime(activity.time);
  const rangeMatch = /^(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})$/.exec(normalizedTime);

  if (rangeMatch) {
    const startDate = combineDateAndTime(date, rangeMatch[1]);
    const endDate = combineDateAndTime(date, rangeMatch[2]);

    if (!startDate || !endDate || endDate <= startDate) {
      return null;
    }

    return {
      title: activity.title,
      startDate,
      endDate,
      location: getActivityMapsLocation(activity),
      notes: activity.description,
    };
  }

  const singleMatch = /^(\d{2}:\d{2})/.exec(normalizedTime);
  if (!singleMatch) {
    return null;
  }

  const startDate = combineDateAndTime(date, singleMatch[1]);
  if (!startDate) {
    return null;
  }

  return {
    title: activity.title,
    startDate,
    endDate: new Date(startDate.getTime() + DEFAULT_DURATION_MS),
    location: getActivityMapsLocation(activity),
    notes: activity.description,
  };
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatIcsDate(date: Date): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/** Safe filename stem for an activity .ics download/share. */
export function buildActivityIcsFilename(activity: Activity): string {
  const safeFilename = activity.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9åäö]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  return `${safeFilename || 'aktivitet'}.ics`;
}

/** Builds an iCalendar (.ics) file for download or share. */
export function buildActivityIcsContent(event: ActivityCalendarEvent, uid: string): string {
  const timestamp = formatIcsDate(new Date());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SeniorHub//SV',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${formatIcsDate(event.startDate)}`,
    `DTEND:${formatIcsDate(event.endDate)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.notes)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
