import type { Activity } from '@/constants/activities';
import type { AddActivityToCalendarResult } from '@/services/calendar/add-activity-to-calendar.types';

/**
 * TypeScript resolution stub. Metro uses platform files:
 * - add-activity-to-calendar.native.ts
 * - add-activity-to-calendar.web.ts
 */
export async function addActivityToCalendar(
  _activity: Activity,
): Promise<AddActivityToCalendarResult> {
  return {
    ok: false,
    errorMessage: 'Kalenderstödet saknas för den här plattformen.',
  };
}
