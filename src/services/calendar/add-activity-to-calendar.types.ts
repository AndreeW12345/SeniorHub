export type AddActivityToCalendarResult =
  | { ok: true; method: 'device-calendar' | 'ics-download' }
  | { ok: false; errorMessage: string };
