import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { geocodeActivityPlaceCore } from '../lib/geocoding/geocode-activity-place-core.js';
import { DEFAULT_GEOCODE_CONFIG } from '../lib/geocoding/geocode-types.js';

const TYRESON_ANCHOR = { latitude: 59.2390408, longitude: 18.3073536 };
const KALMAR_HIT = {
  latitude: 56.6628826,
  longitude: 16.3662382,
  displayName: 'Kalmar, Kalmar kommun, Kalmar län, 392 31, Sverige',
  address: { city: 'Kalmar', municipality: 'Kalmar kommun' },
};
const TYRESON_CENTRUM_HIT = {
  latitude: 59.2437149,
  longitude: 18.2304311,
  displayName: 'Tyresö Centrum, Bollmoravägen, Tyresö kommun, Sverige',
  address: { city: 'Tyresö', municipality: 'Tyresö kommun' },
};

function createMockDeps(responses) {
  const calls = [];

  return {
    calls,
    deps: {
      loadConfig: async () => DEFAULT_GEOCODE_CONFIG,
      searchNominatim: async (_config, query, limit) => {
        calls.push({ query, limit });
        const key = query.includes('Sverige') && query.split(',').length <= 2 ? 'anchor' : 'main';
        return responses[key] ?? [];
      },
      logPiiBlocked: () => {},
    },
  };
}

describe('geocodeActivityPlaceCore', () => {
  it('rejects Kalmar hit for Tyresö using anchor distance filter', async () => {
    const { deps, calls } = createMockDeps({
      anchor: [TYRESON_ANCHOR],
      main: [KALMAR_HIT],
    });

    const result = await geocodeActivityPlaceCore(
      { placeName: 'Tyresö centrum', city: 'Tyresö' },
      { uid: 'org-1' },
      deps,
    );

    assert.equal(result.ok, false);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].query, 'Tyresö, Sverige');
  });

  it('accepts a reliable hit in Tyresö', async () => {
    const { deps } = createMockDeps({
      anchor: [TYRESON_ANCHOR],
      main: [TYRESON_CENTRUM_HIT],
    });

    const result = await geocodeActivityPlaceCore(
      { placeName: 'Tyresö centrum', city: 'Tyresö' },
      { uid: 'org-1' },
      deps,
    );

    assert.equal(result.ok, true);
    assert.equal(result.latitude, TYRESON_CENTRUM_HIT.latitude);
    assert.equal(result.longitude, TYRESON_CENTRUM_HIT.longitude);
  });

  it('blocks PII before any outbound search', async () => {
    const calls = [];
    const result = await geocodeActivityPlaceCore(
      { placeName: 'anna@example.com', city: 'Tyresö' },
      { uid: 'org-1' },
      {
        loadConfig: async () => DEFAULT_GEOCODE_CONFIG,
        searchNominatim: async () => {
          calls.push('should-not-run');
          return [];
        },
      },
    );

    assert.equal(result.ok, false);
    assert.equal(calls.length, 0);
  });

  it('returns same postal validation message as client', async () => {
    const result = await geocodeActivityPlaceCore(
      { placeName: 'Tyresö centrum', city: 'Tyresö', postalCode: '135' },
      { uid: 'org-1' },
      createMockDeps({ anchor: [], main: [] }).deps,
    );

    assert.equal(result.ok, false);
    assert.equal(result.errorMessage, 'Postnummer måste bestå av fem siffror.');
  });
});