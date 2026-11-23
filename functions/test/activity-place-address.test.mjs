import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildActivityGeocodeQuery } from '../lib/geocoding/activity-place-address.js';

describe('buildActivityGeocodeQuery', () => {
  it('does not repeat city when it equals placeName', () => {
    const query = buildActivityGeocodeQuery({
      placeName: 'Tyresö centrum',
      city: 'Tyresö centrum',
    });
    assert.equal(query, 'Tyresö centrum, Sverige');
  });

  it('includes city when it differs from placeName', () => {
    const query = buildActivityGeocodeQuery({
      placeName: 'Tyresö centrum',
      city: 'Tyresö',
    });
    assert.equal(query, 'Tyresö centrum, Tyresö, Sverige');
  });
});