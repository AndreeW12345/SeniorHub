import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isActivityCompleted } from '../functions/src/notifications/activity-fields.ts';

const reference = new Date(2026, 8, 21, 15, 30, 0, 0);

describe('activity detail past booking UI (isActivityCompleted)', () => {
  it('1. past activity: booking would be blocked in UI', () => {
    assert.equal(isActivityCompleted('2026-09-20', reference), true);
  });

  it('2. today: booking remains allowed', () => {
    assert.equal(isActivityCompleted('2026-09-21', reference), false);
  });

  it('3. future activity: booking remains allowed', () => {
    assert.equal(isActivityCompleted('2026-10-01', reference), false);
  });
});
