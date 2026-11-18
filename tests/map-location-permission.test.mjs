import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getMapLocationAccessBanner } from '../src/utils/map-location-permission.ts';

describe('getMapLocationAccessBanner', () => {
  it('returns none when foreground permission is granted', () => {
    assert.equal(getMapLocationAccessBanner({ granted: true, canAskAgain: true }), 'none');
  });

  it('returns denied when the user can still be prompted', () => {
    assert.equal(getMapLocationAccessBanner({ granted: false, canAskAgain: true }), 'denied');
  });

  it('returns settings when iOS no longer shows the permission dialog', () => {
    assert.equal(getMapLocationAccessBanner({ granted: false, canAskAgain: false }), 'settings');
  });
});