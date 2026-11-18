import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { planNominatimOutboundSlot } from '../lib/geocoding/nominatim-rate-limit.js';

describe('global nominatim rate limit planning', () => {
  it('serializes concurrent slots at least 1 second apart', () => {
    let stored;
    const arrivals = [0, 10, 20];

    const executeAt = arrivals.map((now) => {
      const plan = planNominatimOutboundSlot(now, stored);
      stored = plan.nextStoredSlotAtMs;
      return plan.executeAtMs;
    });

    assert.equal(executeAt[0], 0);
    assert.equal(executeAt[1], 1000);
    assert.equal(executeAt[2], 2000);
  });

  it('waits for future slot when reserve is still ahead', () => {
    const plan = planNominatimOutboundSlot(500, 2000);
    assert.equal(plan.executeAtMs, 2000);
    assert.equal(plan.nextStoredSlotAtMs, 3000);
  });
});