import * as Calendar from 'expo-calendar/legacy';
import { Platform } from 'react-native';

import type { Activity } from '@/constants/activities';
import type { AddActivityToCalendarResult } from '@/services/calendar/add-activity-to-calendar.types';
import { buildActivityCalendarEvent } from '@/utils/activity-calendar-event';

async function ensureCalendarPermission(): Promise<boolean> {
  const current = await Calendar.getCalendarPermissionsAsync();
  if (current.status === 'granted') {
    return true;
  }

  const requested = await Calendar.requestCalendarPermissionsAsync();
  return requested.status === 'granted';
}

async function getWritableCalendarId(): Promise<string | null> {
  try {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    if (defaultCalendar?.id) {
      return defaultCalendar.id;
    }
  } catch {
    // Android has no single default calendar; fall back to the list below.
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writableCalendar =
    calendars.find((calendar) => calendar.allowsModifications && calendar.isPrimary) ??
    calendars.find((calendar) => calendar.allowsModifications);

  return writableCalendar?.id ?? null;
}

/** Adds an activity directly to the device calendar on iOS and Android. */
export async function addActivityToCalendar(activity: Activity): Promise<AddActivityToCalendarResult> {
  const event = buildActivityCalendarEvent(activity);
  if (!event) {
    return {
      ok: false,
      errorMessage: 'Aktivitetens datum eller tid kunde inte läsas. Kontrollera att de är korrekt ifyllda.',
    };
  }

  const hasPermission = await ensureCalendarPermission();
  if (!hasPermission) {
    return {
      ok: false,
      errorMessage: 'Kalenderbehörighet krävs för att lägga till aktiviteten.',
    };
  }

  const calendarId = await getWritableCalendarId();
  if (!calendarId) {
    return {
      ok: false,
      errorMessage: 'Kunde inte hitta en kalender att spara aktiviteten i.',
    };
  }

  try {
    await Calendar.createEventAsync(calendarId, {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      notes: event.notes,
      timeZone: Platform.OS === 'android' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
    });

    return { ok: true, method: 'device-calendar' };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte skapa kalenderhändelse:', error);
    return {
      ok: false,
      errorMessage: 'Kunde inte lägga till aktiviteten i kalendern just nu.',
    };
  }
}
