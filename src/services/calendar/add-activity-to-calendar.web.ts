import type { Activity } from '@/constants/activities';
import {
  buildActivityCalendarEvent,
  buildActivityIcsContent,
} from '@/utils/activity-calendar-event';

import type { AddActivityToCalendarResult } from '@/services/calendar/add-activity-to-calendar.types';

function downloadIcsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Web fallback that downloads an .ics file the user can import into their calendar. */
export async function addActivityToCalendar(activity: Activity): Promise<AddActivityToCalendarResult> {
  const event = buildActivityCalendarEvent(activity);
  if (!event) {
    return {
      ok: false,
      errorMessage: 'Aktivitetens datum eller tid kunde inte läsas. Kontrollera att de är korrekt ifyllda.',
    };
  }

  try {
    const uid = `${activity.id}@seniorhub`;
    const icsContent = buildActivityIcsContent(event, uid);
    const safeFilename = activity.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9åäö]+/gi, '-')
      .replace(/^-+|-+$/g, '');

    downloadIcsFile(`${safeFilename || 'aktivitet'}.ics`, icsContent);
    return { ok: true, method: 'ics-download' };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte skapa kalenderfil:', error);
    return {
      ok: false,
      errorMessage: 'Kunde inte skapa kalenderfilen just nu.',
    };
  }
}
