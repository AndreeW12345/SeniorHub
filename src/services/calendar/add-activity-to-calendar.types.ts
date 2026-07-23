export type AddActivityToCalendarResult =
  | { ok: true; method: 'device-calendar' | 'ics-download' }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled?: false; errorMessage: string };
