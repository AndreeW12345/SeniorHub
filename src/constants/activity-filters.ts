/** Multi-select quick filters for the activities browse screen (top row). */
export const ACTIVITY_QUICK_FILTERS = [
  'today',
  'this_week',
  'registration_required',
] as const;

export type ActivityQuickFilter = (typeof ACTIVITY_QUICK_FILTERS)[number];

export const ACTIVITY_QUICK_FILTER_LABELS: Record<ActivityQuickFilter, string> = {
  today: 'Idag',
  this_week: 'Denna vecka',
  registration_required: 'Kräver anmälan',
};

export function isActivityQuickFilter(value: string): value is ActivityQuickFilter {
  return (ACTIVITY_QUICK_FILTERS as readonly string[]).includes(value);
}
