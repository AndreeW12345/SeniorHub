import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseDateValue } from '../src/utils/date-time-format.ts';

/** Mirrors isActivityCompleted in src/utils/admin-statistics.ts for node --test. */
function isActivityCompleted(activityDate, referenceDate = new Date()) {
  const parsed = parseDateValue(activityDate);
  if (!parsed) {
    return false;
  }

  const formatDateValue = (date) => {
    const pad = (value) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  return formatDateValue(parsed) < formatDateValue(referenceDate);
}

/** Mirrors ActivityCard completed-badge / availability rules. */
function resolveActivityCardFavoriteDisplay(activity, showCompletedBadge, referenceDate) {
  const showCompletedState = showCompletedBadge && isActivityCompleted(activity.date, referenceDate);
  const hasParticipantLimit = activity.hasParticipantLimit === true;

  return {
    showCompletedBadge: showCompletedState,
    completedLabel: showCompletedState ? 'Genomförd' : null,
    showAvailability: !showCompletedState && hasParticipantLimit,
  };
}

function getActivitiesByIds(activities, ids) {
  const activityMap = new Map(activities.map((activity) => [activity.id, activity]));
  return ids
    .map((id) => activityMap.get(id))
    .filter((activity) => activity !== undefined);
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
    hasParticipantLimit: true,
    maxParticipants: 10,
    participants: 8,
    ...overrides,
  };
}

describe('favorites completed badge (ActivityCard logic)', () => {
  it('A. past activity + showCompletedBadge=true shows Genomförd', () => {
    const display = resolveActivityCardFavoriteDisplay(
      activity('past', '2026-09-20'),
      true,
      reference,
    );
    assert.equal(display.completedLabel, 'Genomförd');
    assert.equal(display.showCompletedBadge, true);
  });

  it('B. today + showCompletedBadge=true does not show Genomförd', () => {
    const display = resolveActivityCardFavoriteDisplay(
      activity('today', '2026-09-21'),
      true,
      reference,
    );
    assert.equal(display.completedLabel, null);
    assert.equal(display.showCompletedBadge, false);
  });

  it('C. future + showCompletedBadge=true does not show Genomförd', () => {
    const display = resolveActivityCardFavoriteDisplay(
      activity('future', '2026-10-15'),
      true,
      reference,
    );
    assert.equal(display.completedLabel, null);
  });

  it('D. showCompletedBadge=false never shows Genomförd', () => {
    const display = resolveActivityCardFavoriteDisplay(
      activity('past', '2026-09-20'),
      false,
      reference,
    );
    assert.equal(display.completedLabel, null);
    assert.equal(display.showCompletedBadge, false);
  });

  it('E. past favorite remains in favorites resolution', () => {
    const past = activity('past-fav', '2026-09-20');
    const future = activity('future-fav', '2026-10-01');
    const favorites = getActivitiesByIds([past, future], ['past-fav', 'future-fav']);
    assert.deepEqual(
      favorites.map((item) => item.id),
      ['past-fav', 'future-fav'],
    );
  });

  it('F. past activity hides availability when completed badge is active', () => {
    const display = resolveActivityCardFavoriteDisplay(
      activity('past', '2026-09-20'),
      true,
      reference,
    );
    assert.equal(display.showAvailability, false);
  });
});
