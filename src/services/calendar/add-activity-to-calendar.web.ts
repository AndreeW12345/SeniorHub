import type { Activity } from '@/constants/activities';
import type { AddActivityToCalendarResult } from '@/services/calendar/add-activity-to-calendar.types';
import { exportActivityAsIcs } from '@/services/calendar/export-activity-as-ics';

/** Web cannot open the device calendar UI, so always export an .ics file. */
export async function addActivityToCalendar(activity: Activity): Promise<AddActivityToCalendarResult> {
  return exportActivityAsIcs(activity);
}
