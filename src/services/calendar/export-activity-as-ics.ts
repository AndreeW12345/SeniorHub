import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Activity } from '@/constants/activities';
import type { AddActivityToCalendarResult } from '@/services/calendar/add-activity-to-calendar.types';
import {
  buildActivityCalendarEvent,
  buildActivityIcsContent,
  buildActivityIcsFilename,
} from '@/utils/activity-calendar-event';

/** Shares an .ics file so the user can import the activity into a calendar app. */
export async function exportActivityAsIcs(activity: Activity): Promise<AddActivityToCalendarResult> {
  const event = buildActivityCalendarEvent(activity);
  if (!event) {
    return {
      ok: false,
      errorMessage: 'Aktivitetens datum eller tid kunde inte läsas. Kontrollera att de är korrekt ifyllda.',
    };
  }

  try {
    const sharingAvailable = await Sharing.isAvailableAsync();
    if (!sharingAvailable) {
      return {
        ok: false,
        errorMessage: 'Kunde inte dela kalenderfilen på den här enheten.',
      };
    }

    const uid = `${activity.id}@seniorhub`;
    const icsContent = buildActivityIcsContent(event, uid);
    const filename = buildActivityIcsFilename(activity);
    const file = new File(Paths.cache, filename);

    if (file.exists) {
      file.delete();
    }

    file.create();
    file.write(icsContent);

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/calendar',
      dialogTitle: 'Lägg till i kalender',
      UTI: 'public.calendar-event',
    });

    return { ok: true, method: 'ics-download' };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte skapa kalenderfil:', error);
    return {
      ok: false,
      errorMessage: 'Kunde inte skapa kalenderfilen just nu.',
    };
  }
}
