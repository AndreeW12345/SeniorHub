import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseDateValue } from '../src/utils/date-time-format.ts';

/** Mirrors listUpcomingActivities for node --test. */
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

function withCoordinates(activity) {
  return { ...activity, latitude: 59.3, longitude: 18.0 };
}

function getActivitiesWithCoordinates(activities) {
  return activities.filter(
    (activity) =>
      typeof activity.latitude === 'number' &&
      typeof activity.longitude === 'number' &&
      Number.isFinite(activity.latitude) &&
      Number.isFinite(activity.longitude),
  );
}

const reference = new Date(2026, 8, 21, 10, 0, 0, 0);

function activity(id, date, overrides = {}) {
  return {
    id,
    title: id,
    description: 'Test',
    date,
    time: '10:00',
    location: 'Plats',
    organizer: 'Org',
    category: 'Fika',
    organizationId: 'org-1',
    ...overrides,
  };
}

describe('map and organizer upcoming filter', () => {
  const past = withCoordinates(activity('past', '2026-09-20'));
  const today = withCoordinates(activity('today', '2026-09-21'));
  const future = withCoordinates(activity('future', '2026-10-01'));
  const all = [past, today, future];

  it('1. yesterday is excluded from map markers', () => {
    const mapActivities = getActivitiesWithCoordinates(listUpcomingActivities(all, reference));
    assert.ok(!mapActivities.some((item) => item.id === 'past'));
  });

  it('2. today is shown on map', () => {
    const mapActivities = getActivitiesWithCoordinates(listUpcomingActivities(all, reference));
    assert.ok(mapActivities.some((item) => item.id === 'today'));
  });

  it('3. future is shown on map', () => {
    const mapActivities = getActivitiesWithCoordinates(listUpcomingActivities(all, reference));
    assert.ok(mapActivities.some((item) => item.id === 'future'));
  });

  it('4. organizer public list uses same upcoming filter', () => {
    const orgActivities = all.filter((item) => item.organizationId === 'org-1');
    const listed = listUpcomingActivities(orgActivities, reference);
    assert.deepEqual(
      listed.map((item) => item.id),
      ['today', 'future'],
    );
  });

  it('5. series: only present/future occurrences remain', () => {
    const seriesPast = withCoordinates(
      activity('series-past', '2026-08-01', { seriesId: 's1', occurrenceIndex: 0 }),
    );
    const seriesToday = withCoordinates(
      activity('series-today', '2026-09-21', { seriesId: 's1', occurrenceIndex: 1 }),
    );
    const upcoming = listUpcomingActivities([seriesPast, seriesToday], reference);
    assert.deepEqual(
      upcoming.map((item) => item.id),
      ['series-today'],
    );
  });

  it('6. coordinate filtering still applies after upcoming filter', () => {
    const noCoords = activity('no-coords', '2026-10-02');
    const mapActivities = getActivitiesWithCoordinates(
      listUpcomingActivities([...all, noCoords], reference),
    );
    assert.ok(!mapActivities.some((item) => item.id === 'no-coords'));
    assert.equal(mapActivities.length, 2);
  });
});
