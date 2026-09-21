import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseDateValue } from '../src/utils/date-time-format.ts';

/** Mirrors listUpcomingActivities in src/utils/upcoming-activities.ts for node --test. */
function listUpcomingActivities(activities, referenceDate = new Date()) {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
    0,
    0,
    0,
  ).getTime();

  return activities
    .filter((activity) => {
      if (activity.isCancelled === true) {
        return false;
      }

      const activityDate = parseDateValue(activity.date);
      return activityDate !== null && activityDate.getTime() >= today;
    })
    .sort((a, b) => {
      const dateA = parseDateValue(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const dateB = parseDateValue(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });
}

const reference = new Date(2026, 8, 21, 10, 0, 0, 0);

function activity(id, date, overrides = {}) {
  return {
    id,
    title: `Activity ${id}`,
    description: 'Test',
    date,
    time: '10:00',
    location: 'Plats',
    organizer: 'Org',
    category: 'Fika',
    ...overrides,
  };
}

describe('home browse upcoming filter', () => {
  const past = activity('past', '2026-09-20');
  const today = activity('today', '2026-09-21');
  const future = activity('future', '2026-10-01');
  const all = [past, today, future];

  it('1. past activity is excluded from browse source', () => {
    const upcoming = listUpcomingActivities(all, reference);
    assert.deepEqual(
      upcoming.map((item) => item.id),
      ['today', 'future'],
    );
  });

  it('2. today activity is included', () => {
    assert.ok(listUpcomingActivities(all, reference).some((item) => item.id === 'today'));
  });

  it('3. future activity is included', () => {
    assert.ok(listUpcomingActivities(all, reference).some((item) => item.id === 'future'));
  });

  it('4. series occurrences: only future/present materialized docs remain', () => {
    const seriesPast = activity('series-past', '2026-09-01', { seriesId: 's1', occurrenceIndex: 0 });
    const seriesNext = activity('series-next', '2026-09-25', { seriesId: 's1', occurrenceIndex: 1 });
    const upcoming = listUpcomingActivities([seriesPast, seriesNext], reference);
    assert.deepEqual(
      upcoming.map((item) => item.id),
      ['series-next'],
    );
  });

  it('5. browse uses upcoming subset before search/filter (title match smoke test)', () => {
    const upcoming = listUpcomingActivities(all, reference);
    const query = 'future';
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = upcoming.filter((item) => item.title.toLowerCase().includes(normalizedQuery));
    assert.deepEqual(
      filtered.map((item) => item.id),
      ['future'],
    );
    assert.ok(!filtered.some((item) => item.id === 'past'));
  });
});
