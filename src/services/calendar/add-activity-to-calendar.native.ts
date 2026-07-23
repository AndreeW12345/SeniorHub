import * as Calendar from 'expo-calendar/legacy';

import type { Activity } from '@/constants/activities';
import type { AddActivityToCalendarResult } from '@/services/calendar/add-activity-to-calendar.types';
import { exportActivityAsIcs } from '@/services/calendar/export-activity-as-ics';
import { buildActivityCalendarEvent } from '@/utils/activity-calendar-event';

async function openDeviceCalendarForm(activity: Activity): Promise<AddActivityToCalendarResult | null> {
  const event = buildActivityCalendarEvent(activity);
  if (!event) {
    return {
      ok: false,
      errorMessage: 'Aktivitetens datum eller tid kunde inte läsas. Kontrollera att de är korrekt ifyllda.',
    };
  }

  const isAvailable = await Calendar.isAvailableAsync();
  if (!isAvailable) {
    return null;
  }

  // Best-effort permission request. The system create-event UI may still work
  // with write-only access on newer iOS versions even if this is denied.
  try {
    const current = await Calendar.getCalendarPermissionsAsync();
    if (current.status !== 'granted') {
      await Calendar.requestCalendarPermissionsAsync();
    }
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte begära kalenderbehörighet:', error);
  }

  const result = await Calendar.createEventInCalendarAsync({
    title: event.title,
    notes: event.notes,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
  });

  if (result.action === Calendar.CalendarDialogResultActions.canceled) {
    return { ok: false, cancelled: true };
  }

  return { ok: true, method: 'device-calendar' };
}

/**
 * Opens the OS calendar UI with a pre-filled event on iOS/Android.
 * Falls back to sharing an .ics file when the device calendar cannot be opened.
 */
export async function addActivityToCalendar(activity: Activity): Promise<AddActivityToCalendarResult> {
  try {
    const deviceResult = await openDeviceCalendarForm(activity);
    if (deviceResult) {
      return deviceResult;
    }
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte öppna enhetskalendern, faller tillbaka till .ics:', error);
  }

  return exportActivityAsIcs(activity);
}
