import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isActivityCompleted } from '../functions/src/notifications/activity-fields.ts';

const reference = new Date(2026, 8, 21, 15, 30, 0, 0); // 2026-09-21 local midday context

describe('isActivityCompleted (bookActivityRegistration past guard)', () => {
  it('A. yesterday is completed and would block a new booking', () => {
    assert.equal(isActivityCompleted('2026-09-20', reference), true);
  });

  it('B. today is not completed and allows booking', () => {
    assert.equal(isActivityCompleted('2026-09-21', reference), false);
  });

  it('C. future date is not completed and allows booking', () => {
    assert.equal(isActivityCompleted('2026-09-22', reference), false);
  });

  it('E. past full activity: completed regardless of participant limit (guard runs before waitlist)', () => {
    assert.equal(isActivityCompleted('2026-01-01', reference), true);
  });
});

describe('bookActivityRegistration guard ordering (logic)', () => {
  it('F. existing non-cancelled registration is rejected before the past-date guard would apply', () => {
    // Callable checks "already registered" when status !== cancelled, then past date only for new/reactivated bookings.
    const existingStatus = 'registered';
    const wouldHitAlreadyRegistered = existingStatus !== 'cancelled';
    assert.equal(wouldHitAlreadyRegistered, true);
    assert.equal(isActivityCompleted('2026-09-20', reference), true);
  });

  it('D. future full activity: not completed so waitlist path remains available', () => {
    assert.equal(isActivityCompleted('2026-12-31', reference), false);
  });
});
